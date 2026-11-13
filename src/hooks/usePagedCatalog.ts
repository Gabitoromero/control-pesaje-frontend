import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Page, PageQuery, SortDirection } from '../api/pagination';

export type CatalogStatus = 'activo' | 'inactivo';

export const DEFAULT_PAGE_SIZE = 20;

export interface UsePagedCatalogOptions<T> {
  /** Query-key prefix; invalidating `[key]` refreshes every cached page of the catalog. */
  key: string;
  fetchActive: (query: PageQuery) => Promise<Page<T>>;
  fetchInactive: (query: PageQuery) => Promise<Page<T>>;
  defaultField: string;
  sortBy: string;
  sortDirection?: SortDirection;
  pageSize?: number;
  debounceMs?: number;
  /** Catalog-specific filters (for example the users' sector). Changing them returns to page 1. */
  extra?: object;
  /** Set to false to hold the request, for example until the user is authenticated. */
  enabled?: boolean;
}

/**
 * Server-side paginated list state: only the chosen state and current page are requested.
 * Search and filters run in the database, so they cover the whole catalog, not the visible page.
 */
export function usePagedCatalog<T>({
  key,
  fetchActive,
  fetchInactive,
  defaultField,
  sortBy,
  sortDirection = 'asc',
  pageSize = DEFAULT_PAGE_SIZE,
  debounceMs = 300,
  extra,
  enabled = true,
}: UsePagedCatalogOptions<T>) {
  const [status, setStatus] = useState<CatalogStatus>('activo');
  const [field, setField] = useState(defaultField);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // The page is tied to the filters it was chosen under, so any filter change falls back to page 1.
  const signature = JSON.stringify([status, field, debouncedQuery, extra ?? null]);
  const [chosen, setChosen] = useState({ signature, page: 1 });
  const page = chosen.signature === signature ? chosen.page : 1;
  const setPage = (next: number) => setChosen({ signature, page: next });

  const params: PageQuery = {
    page,
    pageSize,
    sortBy,
    sortDirection,
    ...(debouncedQuery ? { q: debouncedQuery, searchField: field } : {}),
    ...extra,
  };

  const result = useQuery({
    queryKey: [key, 'page', status, params],
    queryFn: () => (status === 'activo' ? fetchActive(params) : fetchInactive(params)),
    placeholderData: keepPreviousData,
    enabled,
  });

  const data = result.data;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isSettled = data !== undefined && !result.isPlaceholderData;

  // A deletion or reactivation can leave the current page empty: move to the last valid one.
  // Adjusting state while rendering is the React pattern for state derived from fetched data.
  if (isSettled && data.items.length === 0 && total > 0 && page > totalPages) {
    setChosen({ signature, page: totalPages });
  }

  return {
    status,
    setStatus,
    field,
    setField,
    query,
    setQuery,
    page,
    setPage,
    pageSize,
    items: data?.items ?? [],
    total,
    totalPages,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isPlaceholderData: result.isPlaceholderData,
    error: result.error,
    refetch: result.refetch,
  };
}
