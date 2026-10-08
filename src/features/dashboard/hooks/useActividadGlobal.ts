import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPasadas } from '../../../api/pasadas';
import { getSesionesActivas } from '../../../api/auth';
import type { Pasada } from '../../../shared/types/index';
import type { SesionActivaAdmin } from '../../../shared/types/auth';

// Stable defaults so the memo below is not recomputed on every render while loading.
const EMPTY_PASADAS: Pasada[] = [];
const EMPTY_SESIONES: SesionActivaAdmin[] = [];

export const useActividadGlobal = () => {
  const { data: pasadas = EMPTY_PASADAS, isLoading: isLoadingPasadas } = useQuery({
    queryKey: ['pasadas-activas-global'],
    queryFn: () => getPasadas({ estado: 'en_curso' }),
    refetchInterval: 10000,
  });

  const { data: sesiones = EMPTY_SESIONES, isLoading: isLoadingSesiones } = useQuery({
    queryKey: ['sesiones-activas-global'],
    queryFn: getSesionesActivas,
    refetchInterval: 10000,
  });

  const hayActividad = pasadas.length > 0 || sesiones.length > 0;
  const isLoading = isLoadingPasadas || isLoadingSesiones;

  // Ids of the lines that currently have an active pasada or session.
  const lineaIdsConActividad = useMemo(() => {
    const ids = new Set<number>();
    for (const p of pasadas) {
      const id = p.lineaProduccion?.id ?? p.lineaProduccionId;
      if (typeof id === 'number') ids.add(id);
    }
    for (const s of sesiones) {
      if (typeof s.lineaId === 'number') ids.add(s.lineaId);
    }
    return ids;
  }, [pasadas, sesiones]);

  return { hayActividad, lineaIdsConActividad, pasadas, sesiones, isLoading };
};
