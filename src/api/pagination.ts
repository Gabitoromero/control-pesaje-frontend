import api from './axios';

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type SortDirection = 'asc' | 'desc';

export interface PageQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  searchField?: string;
  sortBy?: string;
  sortDirection?: SortDirection;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

/** Drops undefined and empty values so the server applies its own defaults. */
export const buildPageParams = (query: object = {}): Record<string, string | number> =>
  Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as Record<string, string | number>;

export const fetchPage = async <T>(path: string, query?: object): Promise<Page<T>> => {
  const response = await api.get<ApiEnvelope<Page<T>>>(path, { params: buildPageParams(query) });
  return response.data.data;
};
