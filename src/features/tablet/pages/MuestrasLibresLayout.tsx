import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/context/AuthContext';
import { getLinea } from '../../../api/lineas';
import { MuestrasLibresProvider } from '../context/MuestrasLibresContext';
import type { RutaPasadaEtapa } from '../../../shared/types/domain';

export function MuestrasLibresLayout() {
  const { activeLineaId, user } = useAuth();

  const { data: linea } = useQuery({
    queryKey: ['linea', activeLineaId],
    queryFn: () => getLinea(activeLineaId!),
    enabled: !!activeLineaId,
  });

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
