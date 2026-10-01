import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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

export function useBalanzaWebSocket(lineaId: number | null) {
  const [pesoNeto, setPesoNeto] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [hardwareId, setHardwareId] = useState<string | undefined>(undefined);
  const [unidad, setUnidad] = useState<UnidadPeso | undefined>(undefined);
  const { logout, user } = useAuth();

  useEffect(() => {
    if (!lineaId) return;

    const socket = getSocket();
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
      console.log(`[Balanza WebSocket] Connected to backend. Emitting 'join-linea' with id:`, lineaId);
      socket.emit('join-linea', lineaId);
    };

    const onDisconnect = () => {
      console.log('[Balanza WebSocket] Disconnected from backend');
      clearStaleTimer();
      setIsConnected(false);
      setPesoNeto(0);
      setHardwareId(undefined);
      setUnidad(undefined);
    };

    const onBalanzaStatus = (data: BalanzaStatusPayload) => {
      console.log(`[Balanza WebSocket] Received 'balanza-status':`, data);
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

  return { pesoNeto, isConnected, hardwareId, unidad };
}
