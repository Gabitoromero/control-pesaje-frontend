import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SearchableCombobox } from './SearchableCombobox';
import type { Page } from '../../api/pagination';

type Option = { id?: number | string; nombre: string };

export interface RemoteComboboxProps<T> {
  value: number | string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (val: any) => void;
  /** Cache key of the catalog; the search text is added to it. */
  queryKey: string;
  /** Bounded server-side search. The server filters, the combobox never filters again. */
  search: (query: { q: string; page: number; pageSize: number }) => Promise<Page<T>>;
  /** Resolves the label of the selected value when it is outside the loaded page. */
  fetchById?: (id: number) => Promise<T>;
  /** Maps a catalog row to the option shown in the list; rows are used as they are when omitted. */
  toOption?: (item: T) => Option;
  placeholder?: string;
  clearable?: boolean;
  emptyLabel?: string;
  pageSize?: number;
  debounceMs?: number;
}

const noticeClass = 'py-4 text-center text-sm text-muted-foreground';

/**
 * Combobox backed by a bounded server-side search. Only one page of results is ever requested;
 * when the catalog is larger the user is asked to refine the search instead of paging through it.
 */
export function RemoteCombobox<T = Option>({
  value,
  onChange,
  queryKey,
  search,
  fetchById,
  toOption = (item) => item as Option,
  placeholder,
  clearable,
  emptyLabel,
  pageSize = 20,
  debounceMs = 300,
}: RemoteComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(typed.trim()), debounceMs);
    return () => clearTimeout(timer);
  }, [typed, debounceMs]);

  // The query key carries the search text, so a late response of an older search lands in its own
  // cache entry and can never replace the results of the newest one.
  const results = useQuery({
    queryKey: ['remote-combobox', queryKey, debounced, pageSize],
    queryFn: () => search({ q: debounced, page: 1, pageSize }),
    enabled: open,
    placeholderData: keepPreviousData,
  });

  const items = (results.data?.items ?? []).map(toOption);
  const total = results.data?.total ?? 0;
  const selectedInResults = value !== null && items.some((item) => item.id === value);
  const hasValue = typeof value === 'number';
  const selectedLookup = useQuery({
    queryKey: ['remote-combobox', queryKey, 'by-id', value],
    queryFn: () => (fetchById as (id: number) => Promise<T>)(value as number),
    enabled: hasValue && fetchById !== undefined && !selectedInResults,
  });

  const status = results.isError ? (
    <div className={noticeClass}>
      <p>No se pudieron cargar las opciones.</p>
      <button
        type="button"
        onClick={() => void results.refetch()}
        className="mt-2 rounded-md border border-border px-3 py-1.5 text-foreground hover:bg-accent"
      >
        Reintentar
      </button>
    </div>
  ) : results.isPending || results.isPlaceholderData ? (
    <div className={noticeClass}>Cargando...</div>
  ) : items.length === 0 ? (
    <div className={noticeClass}>No se encontraron resultados.</div>
  ) : total > items.length ? (
    <div className={noticeClass}>{`Mostrando ${items.length} de ${total}. Refine la búsqueda para ver más.`}</div>
  ) : null;

  return (
    <SearchableCombobox
      value={value}
      onChange={onChange}
      options={items}
      selected={selectedLookup.data ? toOption(selectedLookup.data) : null}
      shouldFilter={false}
      hideEmpty
      status={status}
      onSearchChange={setTyped}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setTyped('');
          setDebounced('');
        }
      }}
      placeholder={placeholder}
      clearable={clearable}
      emptyLabel={emptyLabel}
    />
  );
}
