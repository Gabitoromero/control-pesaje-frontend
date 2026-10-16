import { useEffect, useRef } from 'react';
import { isAxiosError } from 'axios';
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

/**
 * Keeps the backend line session alive. A 404 from the heartbeat means the
 * session no longer exists (backend restart or missed heartbeats): the
 * interval is stopped and `onSessionLost` is called once. Any other error is
 * only logged and the next tick retries.
 */
export const useActividadHeartbeat = (
  lineaId: number | null,
  onSessionLost?: () => void,
) => {
  const onSessionLostRef = useRef(onSessionLost);
  useEffect(() => {
    onSessionLostRef.current = onSessionLost;
  });

  useEffect(() => {
    if (lineaId === null) return;

    let active = true;
    const intervalId = setInterval(() => {
      actualizarActividad(lineaId).catch((err) => {
        if (
          active &&
          onSessionLostRef.current &&
          isAxiosError(err) &&
          err.response?.status === 404
        ) {
          active = false;
          clearInterval(intervalId);
          onSessionLostRef.current();
          return;
        }
        console.error('Failed to update heartbeat:', err);
      });
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [lineaId]);
};
