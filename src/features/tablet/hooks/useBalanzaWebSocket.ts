import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { getSocket } from '../../../services/websocket';
import { useAuth } from '../../auth/context/AuthContext';
import type { UnidadPeso } from '../../../shared/types/domain';

export interface BalanzaData {
  pesoNeto: number;
}

export interface BalanzaStatusPayload {
  isConnected: boolean;
  hardwareId?: string;
  unidad?: UnidadPeso;
}

// The scale streams frames continuously while the net weight is >= 0, but sends
// nothing when it goes negative (e.g. a tared bucket is lifted off). Silence
// must not leave the last weight on screen, so it resets to 0.
export const PESO_STALE_TIMEOUT_MS = 5000;

// How long to wait for the backend ack of a "No veo el peso" report before
// giving up, so the button never stays in "sending" (e.g. against an old backend).
export const REPORTE_ACK_TIMEOUT_MS = 5000;

export type ReportePantalla = 'tablet' | 'muestras-libres';

// Ack contract v1 of `reportar-sin-peso`. Anything else is treated as an error.
const reportAckSchema = z.union([
  z.object({ ok: z.literal(true), code: z.literal('sent') }),
  z.object({ ok: z.literal(false), code: z.literal('cooldown'), retryAfterMs: z.number().finite().nonnegative() }),
  z.object({ ok: z.literal(false), code: z.enum(['no-linea', 'invalid-payload', 'forbidden', 'error']) }),
]);

export type ReportAck = z.infer<typeof reportAckSchema>;
// 'timeout' and 'sin-conexion' are produced by the client, never by the backend.
export type ReportResult = ReportAck | { ok: false; code: 'timeout' | 'sin-conexion' };

export function useBalanzaWebSocket(lineaId: number | null) {
  const [pesoNeto, setPesoNeto] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [hardwareId, setHardwareId] = useState<string | undefined>(undefined);
  const [unidad, setUnidad] = useState<UnidadPeso | undefined>(undefined);
  const [socketConectado, setSocketConectado] = useState<boolean>(() => getSocket().connected);
  const { logout, user } = useAuth();

  // Last frame received, kept apart from `pesoNeto` so the 5 s stale reset to 0
  // does not erase the evidence a "No veo el peso" report needs.
  const lastFrameValueRef = useRef<number | null>(null);
  const lastFrameAtRef = useRef<number | null>(null);
  // True once join-linea was done and the server answered with a balanza-status.
  const enSalaRef = useRef<boolean>(false);

  useEffect(() => {
    if (!lineaId) return;

    const socket = getSocket();
    lastFrameValueRef.current = null;
    lastFrameAtRef.current = null;
    enSalaRef.current = false;
    let staleTimer: ReturnType<typeof setTimeout> | undefined;

    const clearStaleTimer = () => {
      if (staleTimer !== undefined) {
        clearTimeout(staleTimer);
        staleTimer = undefined;
      }
    };

    socket.connect();

    // Join room when connected
    const onConnect = () => {
      setSocketConectado(true);
      console.log(`[Balanza WebSocket] Connected to backend. Emitting 'join-linea' with id:`, lineaId);
      socket.emit('join-linea', lineaId);
    };

    const onDisconnect = () => {
      console.log('[Balanza WebSocket] Disconnected from backend');
      clearStaleTimer();
      setSocketConectado(false);
      enSalaRef.current = false;
      setIsConnected(false);
      setPesoNeto(0);
      setHardwareId(undefined);
      setUnidad(undefined);
    };

    const onBalanzaStatus = (data: BalanzaStatusPayload) => {
      console.log(`[Balanza WebSocket] Received 'balanza-status':`, data);
      enSalaRef.current = true;
      setIsConnected(data.isConnected);
      setHardwareId(data.hardwareId);
      setUnidad(data.unidad);
      if (!data.isConnected) {
        clearStaleTimer();
        setPesoNeto(0);
      }
    };

    const onBalanzaData = (data: BalanzaData) => {
      // A malformed frame must neither reach the screen nor arm a reset toast.
      if (!Number.isFinite(data.pesoNeto)) return;

      lastFrameValueRef.current = data.pesoNeto;
      lastFrameAtRef.current = Date.now();
      setPesoNeto(data.pesoNeto);
      clearStaleTimer();
      staleTimer = setTimeout(() => {
        setPesoNeto(0);
        // Only tell the operator when the screen actually changes: a weight
        // already at 0 going silent is not a reset worth announcing.
        if (data.pesoNeto !== 0) {
          toast.info('La balanza dejó de enviar datos: el peso volvió a 0.');
        }
      }, PESO_STALE_TIMEOUT_MS);
    };

    const onConnectError = (err: Error) => {
      console.error('[Balanza WebSocket] Connect Error:', err.message, err);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onError = (err: any) => {
      console.error('[Balanza WebSocket] Socket Error:', err);
    };

    if (socket.connected) {
      onConnect();
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('error', onError);
    socket.on('balanza-data', onBalanzaData);
    socket.on('balanza-status', onBalanzaStatus);

    // DEBUG: Log ALL incoming events
    socket.onAny((eventName, ...args) => {
      console.log(`[Balanza WebSocket] EVENT RECEIVED: ${eventName}`, args);
    });

    return () => {
      // Dropping the timer without resetting would leave the last weight on
      // screen with nothing left to clear it until the next frame.
      clearStaleTimer();
      setPesoNeto(0);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('error', onError);
      socket.off('balanza-data', onBalanzaData);
      socket.off('balanza-status', onBalanzaStatus);
      socket.emit('leave-linea', lineaId);
    };
  }, [lineaId, logout, user]);

  // Never rejects: every failure is a ReportResult the UI can show.
  const enviarReporteSinPeso = (pantalla: ReportePantalla): Promise<ReportResult> => {
    const socket = getSocket();
    if (!socket.connected) return Promise.resolve({ ok: false, code: 'sin-conexion' });

    const now = Date.now();
    const payload = {
      v: 1,
      lineaId: lineaId || null,
      ultimoPeso: lastFrameValueRef.current,
      ultimoPesoHaceMs: lastFrameAtRef.current === null ? null : now - lastFrameAtRef.current,
      unidad: unidad ?? null,
      socketConectado,
      balanzaConectada: isConnected,
      enSala: enSalaRef.current,
      pantalla,
      clientTs: now,
    };

    return new Promise((resolve) => {
      socket.timeout(REPORTE_ACK_TIMEOUT_MS).emit('reportar-sin-peso', payload, (err: Error | null, res: unknown) => {
        if (err) return resolve({ ok: false, code: 'timeout' });
        const parsed = reportAckSchema.safeParse(res);
        resolve(parsed.success ? parsed.data : { ok: false, code: 'error' });
      });
    });
  };

  return { pesoNeto, isConnected, hardwareId, unidad, socketConectado, enviarReporteSinPeso };
}
