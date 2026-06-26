import { useEffect, useState } from 'react';
import { getSocket } from '../../../services/websocket';

export interface BalanzaData {
  pesoNeto: number;
}

export function useBalanzaWebSocket(lineaId: number | null) {
  const [pesoNeto, setPesoNeto] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!lineaId) return;

    const socket = getSocket();

    socket.connect();

    // Join room when connected
    const onConnect = () => {
      console.log(`[Balanza WebSocket] Connected to backend. Emitting 'join-linea' with id:`, lineaId);
      socket.emit('join-linea', lineaId);
    };

    const onDisconnect = () => {
      console.log('[Balanza WebSocket] Disconnected from backend');
      setIsConnected(false);
      setPesoNeto(0);
    };

    const onBalanzaStatus = (data: { isConnected: boolean }) => {
      console.log(`[Balanza WebSocket] Received 'balanza-status':`, data);
      setIsConnected(data.isConnected);
      if (!data.isConnected) {
        setPesoNeto(0);
      }
    };

    const onBalanzaData = (data: BalanzaData) => {
      setPesoNeto(data.pesoNeto);
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

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('error', onError);
      socket.off('balanza-data', onBalanzaData);
      socket.off('balanza-status', onBalanzaStatus);
      socket.emit('leave-linea', lineaId);
    };
  }, [lineaId]);

  return { pesoNeto, isConnected };
}
