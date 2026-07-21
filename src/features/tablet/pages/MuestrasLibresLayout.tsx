import { Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/context/AuthContext';
import { getLinea } from '../../../api/lineas';
import { MuestrasLibresProvider } from '../context/MuestrasLibresContext';
import { useActividadHeartbeat } from '../hooks/useActividadHeartbeat';
import type { RutaPasadaEtapa } from '../../../shared/types/domain';

export function MuestrasLibresLayout() {
  const { activeLineaId, user } = useAuth();

  const { data: linea } = useQuery({
    queryKey: ['linea', activeLineaId],
    queryFn: () => getLinea(activeLineaId!),
    enabled: !!activeLineaId,
  });

  // Heartbeat: keep the backend line session alive while the operator is on
  // any child route (pasadas list or free quality samples).
  // Called before the guard so the Rules of Hooks hold; the hook no-ops when
  // activeLineaId is null.
  useActividadHeartbeat(activeLineaId);

  if (!activeLineaId || !user) {
    return <Navigate to="/tablet/seleccion-linea" replace />;
  }

  const etapas: RutaPasadaEtapa[] = linea?.rutaPasadaActiva?.etapas ?? [];

  return (
    <MuestrasLibresProvider
      lineaProduccionId={activeLineaId}
      usuarioId={user.id}
      etapas={etapas}
    >
      <Outlet context={{ etapas }} />
    </MuestrasLibresProvider>
  );
}
