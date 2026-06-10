import { useEffect } from 'react';
import { actualizarActividad } from '../../../api/auth';

export const useActividadHeartbeat = (lineaId: number | null) => {
  useEffect(() => {
    if (lineaId === null) return;

    const intervalId = setInterval(() => {
      actualizarActividad().catch((err) => {
        console.error('Failed to update heartbeat:', err);
      });
    }, 120000); // 2 minutos

    return () => clearInterval(intervalId);
  }, [lineaId]);
};
