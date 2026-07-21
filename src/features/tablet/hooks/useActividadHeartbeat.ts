import { useEffect } from 'react';
import { actualizarActividad } from '../../../api/auth';

const DEFAULT_HEARTBEAT_INTERVAL_MS = 120000; // 2 minutos

/** Pure: resolves the heartbeat interval (ms) from an env string. */
export function resolveHeartbeatInterval(
  envValue: string | undefined,
  defaultMs: number = DEFAULT_HEARTBEAT_INTERVAL_MS,
): number {
  if (envValue === undefined) return defaultMs;
  const parsed = Number(envValue);
  if (!Number.isFinite(parsed) || parsed <= 0) return defaultMs;
  return parsed;
}

const HEARTBEAT_INTERVAL_MS = resolveHeartbeatInterval(
  import.meta.env.VITE_HEARTBEAT_INTERVAL_MS,
);

export const useActividadHeartbeat = (lineaId: number | null) => {
  useEffect(() => {
    if (lineaId === null) return;

    const intervalId = setInterval(() => {
      actualizarActividad(lineaId).catch((err) => {
        console.error('Failed to update heartbeat:', err);
      });
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [lineaId]);
};
