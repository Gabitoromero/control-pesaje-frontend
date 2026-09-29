import { queryOptions, useQuery } from '@tanstack/react-query';
import { getToleranciaConfig } from '../api/tolerancia';
import type { ToleranciaConfig } from '../api/tolerancia';

export const TOLERANCE_QUERY_KEY = ['configuracion', 'tolerancia'] as const;

// Propagation of admin edits to tablets: refetch on mount, on window focus and
// every 30s. staleTime must stay <= the interval so interval refetches are never skipped.
const TOLERANCE_REFETCH_INTERVAL_MS = 30_000;
const TOLERANCE_STALE_TIME_MS = 15_000;

export type ToleranceState =
  | { status: 'loading' }
  | { status: 'unavailable'; isRetrying: boolean; retry: () => void }
  | { status: 'ready'; toleranciaPct: number; isStale: boolean };

interface ResolveInput {
  data: ToleranciaConfig | undefined;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
}

/**
 * Pure state derivation. A value that was successfully fetched once is kept
 * even if a later refetch fails (isStale). Registrar is blocked only when a
 * valid value was never obtained (loading / unavailable).
 */
export function resolveToleranceState(input: ResolveInput): ToleranceState {
  const { data, isPending, isError, isFetching, refetch } = input;
  const unavailable: ToleranceState = {
    status: 'unavailable',
    isRetrying: isFetching,
    retry: () => {
      refetch();
    },
  };

  if (data !== undefined) {
    const pct = data.toleranciaPct;
    if (typeof pct === 'number' && Number.isFinite(pct) && pct >= 0) {
      return { status: 'ready', toleranciaPct: pct, isStale: isError };
    }
    return unavailable;
  }
  if (isPending) return { status: 'loading' };
  return unavailable;
}

// The app QueryClient defaults are refetchOnWindowFocus:false / retry:1, so
// every option is set explicitly here.
export const toleranceQueryOptions = () =>
  queryOptions({
    queryKey: TOLERANCE_QUERY_KEY,
    queryFn: getToleranciaConfig,
    retry: 3,
    staleTime: TOLERANCE_STALE_TIME_MS,
    gcTime: Infinity,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: TOLERANCE_REFETCH_INTERVAL_MS,
  });

export function useToleranceConfig(): ToleranceState {
  const { data, isPending, isError, isFetching, refetch } = useQuery(toleranceQueryOptions());
  return resolveToleranceState({ data, isPending, isError, isFetching, refetch });
}
