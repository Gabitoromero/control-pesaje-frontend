import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  TOLERANCE_QUERY_KEY,
  resolveToleranceState,
  toleranceQueryOptions,
  useToleranceConfig,
} from './useToleranceConfig';
import type { ToleranciaConfig } from '../api/tolerancia';

const config = (toleranciaPct: number): ToleranciaConfig => ({
  toleranciaPct,
  updatedAt: '2026-09-29T12:00:00.000Z',
  updatedBy: null,
});

const baseInput = {
  data: undefined as ToleranciaConfig | undefined,
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: () => {},
};

describe('resolveToleranceState', () => {
  it('returns loading while pending with no data', () => {
    expect(resolveToleranceState({ ...baseInput, isPending: true, isFetching: true })).toEqual({
      status: 'loading',
    });
  });

  it('returns unavailable when errored with no data, exposing isRetrying from isFetching', () => {
    const idle = resolveToleranceState({ ...baseInput, isError: true, isFetching: false });
    const retrying = resolveToleranceState({ ...baseInput, isError: true, isFetching: true });
    expect(idle).toMatchObject({ status: 'unavailable', isRetrying: false });
    expect(retrying).toMatchObject({ status: 'unavailable', isRetrying: true });
  });

  it('unavailable.retry calls refetch', () => {
    const refetch = vi.fn();
    const state = resolveToleranceState({ ...baseInput, isError: true, refetch });
    if (state.status !== 'unavailable') throw new Error('expected unavailable');
    state.retry();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('returns ready with the value for valid data', () => {
    expect(resolveToleranceState({ ...baseInput, data: config(12.5) })).toEqual({
      status: 'ready',
      toleranciaPct: 12.5,
      isStale: false,
    });
  });

  it('accepts 0 as a valid tolerance', () => {
    expect(resolveToleranceState({ ...baseInput, data: config(0) })).toMatchObject({
      status: 'ready',
      toleranciaPct: 0,
    });
  });

  it('keeps the last value (ready, isStale) when data exists and the latest refetch errored', () => {
    expect(resolveToleranceState({ ...baseInput, data: config(30), isError: true })).toEqual({
      status: 'ready',
      toleranciaPct: 30,
      isStale: true,
    });
  });

  it('returns unavailable for invalid data (NaN or negative)', () => {
    expect(resolveToleranceState({ ...baseInput, data: config(NaN) }).status).toBe('unavailable');
    expect(resolveToleranceState({ ...baseInput, data: config(-1) }).status).toBe('unavailable');
  });
});

describe('toleranceQueryOptions', () => {
  it('uses the agreed polling/caching options (staleTime <= refetchInterval)', () => {
    const options = toleranceQueryOptions();
    expect(options.queryKey).toEqual(TOLERANCE_QUERY_KEY);
    expect(options.retry).toBe(3);
    expect(options.staleTime).toBe(15_000);
    expect(options.refetchInterval).toBe(30_000);
    expect(options.gcTime).toBe(Infinity);
    expect(options.refetchOnMount).toBe(true);
    expect(options.refetchOnWindowFocus).toBe(true);
    expect(options.staleTime as number).toBeLessThanOrEqual(options.refetchInterval as number);
  });
});

describe('useToleranceConfig', () => {
  const BASE = 'http://localhost:3000/api';
  const server = setupServer();
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const wrapper = () => {
    // retryDelay is not set by the hook, so the client default keeps the retries fast.
    const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 1 } } });
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

  it('goes loading -> ready(20) on a successful fetch', async () => {
    server.use(
      http.get(`${BASE}/configuracion/tolerancia`, () =>
        HttpResponse.json({ success: true, data: config(20) }),
      ),
    );

    const { result } = renderHook(() => useToleranceConfig(), { wrapper: wrapper() });
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current).toMatchObject({ status: 'ready', toleranciaPct: 20 }));
  });

  it('becomes unavailable after retries are exhausted, then recovers via retry()', async () => {
    let calls = 0;
    let failing = true;
    server.use(
      http.get(`${BASE}/configuracion/tolerancia`, () => {
        calls += 1;
        return failing
          ? HttpResponse.json({ success: false }, { status: 500 })
          : HttpResponse.json({ success: true, data: config(35) });
      }),
    );

    const { result } = renderHook(() => useToleranceConfig(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.status).toBe('unavailable'), { timeout: 3000 });
    expect(calls).toBe(4); // 1 attempt + 3 retries

    failing = false;
    act(() => {
      if (result.current.status === 'unavailable') result.current.retry();
    });
    await waitFor(() => expect(result.current).toMatchObject({ status: 'ready', toleranciaPct: 35 }));
  });
});
