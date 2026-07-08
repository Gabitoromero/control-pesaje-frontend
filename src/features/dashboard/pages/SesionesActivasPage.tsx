import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSesionesActivas, cerrarSesionLinea } from '../../../api/auth';
import { Trash2 } from 'lucide-react';
import { useDialog } from '../../../components/dialogs/useDialog';
import { getApiErrorMessage } from '../../../utils/errors';

interface EnrichedSession {
  lineaId: number;
  lineaNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  legajo: string;
  fechaInicio: string;
  expiraEn: string | null;
}

export const SesionesActivasPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { confirm, alertError } = useDialog();

  const { data: sessions = [], isLoading: loading, error } = useQuery<EnrichedSession[]>({
    queryKey: ['sesiones-activas'],
    queryFn: async () => {
      // Backend now returns legajo directly; no need for N+1 queries.
      const data = await getSesionesActivas();
      return data as EnrichedSession[];
    },
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  const closeSessionMutation = useMutation({
    mutationFn: (lineaId: number) => cerrarSesionLinea(lineaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sesiones-activas'] });
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo cerrar la sesión',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const handleCloseSession = async (session: EnrichedSession) => {
    const confirmed = await confirm({
      title: `¿Estás seguro de que deseas cerrar la sesión de ${session.usuarioNombre} en ${session.lineaNombre}?`,
      confirmText: 'Cerrar sesión',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
    if (confirmed) {
      closeSessionMutation.mutate(session.lineaId);
    }
  };

  if (loading) {
    return <div className="p-6 text-foreground">Cargando sesiones...</div>;
  }

  if (error) {
    return <div className="p-6 text-destructive">Error al cargar las sesiones activas</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Sesiones Activas</h2>
      {sessions.length === 0 ? (
        <p className="text-muted-foreground">No hay sesiones activas en la planta.</p>
      ) : (
        <div className="bg-card border border-border rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Línea de Producción
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Usuario
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Legajo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Inicio de Sesión
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Expiración (aprox)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {sessions.map((session) => (
                <tr key={`${session.lineaId}-${session.usuarioId}`} className="hover:bg-accent even:bg-muted/40">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {session.lineaNombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {session.usuarioNombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {session.legajo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(session.fechaInicio).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {session.expiraEn ? new Date(session.expiraEn).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                      En curso
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleCloseSession(session)}
                      disabled={closeSessionMutation.isPending}
                      className="text-destructive hover:text-destructive/80 focus:outline-none disabled:opacity-50 flex items-center justify-end w-full"
                      title="Cerrar sesión"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
