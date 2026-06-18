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
      setIsConnected(true);
      socket.emit('join-linea', lineaId);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setPesoNeto(0);
    };

    const onBalanzaData = (data: BalanzaData) => {
      setPesoNeto(data.pesoNeto);
    };

    if (socket.connected) {
      onConnect();
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('balanza-data', onBalanzaData);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('balanza-data', onBalanzaData);
      socket.emit('leave-linea', lineaId);
      // Depending on architecture, you might not want to completely disconnect the socket if shared
      // but for now we keep it connected for background stability or other modules.
    };
  }, [lineaId]);

  return { pesoNeto, isConnected };
}
