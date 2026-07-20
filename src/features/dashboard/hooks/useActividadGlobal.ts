import { useQuery } from '@tanstack/react-query';
import { getPasadas } from '../../../api/pasadas';
import { getSesionesActivas } from '../../../api/auth';

export const useActividadGlobal = () => {
  const { data: pasadas = [], isLoading: isLoadingPasadas } = useQuery({
    queryKey: ['pasadas-activas-global'],
    queryFn: () => getPasadas({ estado: 'en_curso' }),
    refetchInterval: 10000,
  });

  const { data: sesiones = [], isLoading: isLoadingSesiones } = useQuery({
    queryKey: ['sesiones-activas-global'],
    queryFn: getSesionesActivas,
    refetchInterval: 10000,
  });

  const hayActividad = pasadas.length > 0 || sesiones.length > 0;
  const isLoading = isLoadingPasadas || isLoadingSesiones;

  return { hayActividad, pasadas, sesiones, isLoading };
};
