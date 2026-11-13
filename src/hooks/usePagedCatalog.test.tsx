import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePagedCatalog } from './usePagedCatalog';
import type { Page, PageQuery } from '../api/pagination';

interface Row {
  id: number;
}

const pageOf = (items: Row[], total: number, page: number, pageSize = 20): Page<Row> => ({
  items,
  total,
  page,
  pageSize,
});

const fetchActive = vi.fn<(q: PageQuery) => Promise<Page<Row>>>();
const fetchInactive = vi.fn<(q: PageQuery) => Promise<Page<Row>>>();

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

const setup = (extra: object = {}) =>
  renderHook(
    (props: { extra: object }) =>
      usePagedCatalog<Row>({
        key: 'things',
        fetchActive,
        fetchInactive,
        defaultField: 'nombre',
        sortBy: 'nombre',
        debounceMs: 10,
        extra: props.extra,
      }),
    { wrapper, initialProps: { extra } },
  );

beforeEach(() => {
  fetchActive.mockReset();
  fetchInactive.mockReset();
  fetchActive.mockResolvedValue(pageOf([{ id: 1 }], 45, 1));
  fetchInactive.mockResolvedValue(pageOf([], 0, 1));
});

describe('usePagedCatalog', () => {
  it('requests the first active page with bounded defaults and no search text', async () => {
    const { result } = setup();

    await waitFor(() => expect(result.current.items).toEqual([{ id: 1 }]));
    expect(fetchActive).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      sortBy: 'nombre',
      sortDirection: 'asc',
    });
    expect(result.current.total).toBe(45);
    expect(result.current.totalPages).toBe(3);
    expect(fetchInactive).not.toHaveBeenCalled();
  });

  it('holds the request while disabled and sends it once enabled', async () => {
    const { result, rerender } = renderHook(
      (props: { enabled: boolean }) =>
        usePagedCatalog<Row>({
          key: 'gated',
          fetchActive,
          fetchInactive,
          defaultField: 'nombre',
          sortBy: 'nombre',
          enabled: props.enabled,
        }),
      { wrapper, initialProps: { enabled: false } },
    );

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(fetchActive).not.toHaveBeenCalled();

    rerender({ enabled: true });

    await waitFor(() => expect(result.current.items).toEqual([{ id: 1 }]));
    expect(fetchActive).toHaveBeenCalledTimes(1);
  });

  it('requests the chosen page', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.setPage(2));

    await waitFor(() => expect(fetchActive).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));
  });

  it('searches in the server after the debounce and returns to page 1', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    act(() => result.current.setPage(3));
    await waitFor(() => expect(fetchActive).toHaveBeenLastCalledWith(expect.objectContaining({ page: 3 })));

    act(() => result.current.setQuery('abc'));

    expect(result.current.query).toBe('abc');
    await waitFor(() =>
      expect(fetchActive).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, q: 'abc', searchField: 'nombre' }),
      ),
    );
    expect(result.current.page).toBe(1);
  });

  it('uses the inactive request for the inactive status and resets the page', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    act(() => result.current.setPage(2));

    act(() => result.current.setStatus('inactivo'));

    await waitFor(() => expect(fetchInactive).toHaveBeenCalledWith(expect.objectContaining({ page: 1 })));
    expect(result.current.page).toBe(1);
  });

  it('resets to page 1 and forwards catalog-specific filters', async () => {
    const { result, rerender } = setup();
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    act(() => result.current.setPage(2));

    rerender({ extra: { sector: 'OF' } });

    await waitFor(() =>
      expect(fetchActive).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, sector: 'OF' })),
    );
  });

  it('moves to the last valid page when the current one is now empty', async () => {
    fetchActive.mockImplementation(async ({ page }) =>
      page === 3 ? pageOf([], 25, 3) : pageOf([{ id: 9 }], 25, page ?? 1),
    );
    const { result } = setup();
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.setPage(3));

    await waitFor(() => expect(result.current.page).toBe(2));
    await waitFor(() => expect(result.current.items).toEqual([{ id: 9 }]));
  });
});
