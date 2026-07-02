import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSesionesActivas, cerrarSesionLinea } from '../../../api/auth';
import { Trash2 } from 'lucide-react';

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
  });

  if (loading) {
    return <div className="p-6 text-gray-500">Cargando sesiones...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error al cargar las sesiones activas</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Sesiones Activas</h2>
      {sessions.length === 0 ? (
        <p className="text-gray-500">No hay sesiones activas en la planta.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Línea de Producción
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Legajo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inicio de Sesión
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiración (aprox)
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={`${session.lineaId}-${session.usuarioId}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{session.lineaNombre}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{session.usuarioNombre}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{session.legajo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(session.fechaInicio).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {session.expiraEn ? new Date(session.expiraEn).toLocaleString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Estás seguro de que deseas cerrar la sesión de ${session.usuarioNombre} en ${session.lineaNombre}?`)) {
                          closeSessionMutation.mutate(session.lineaId);
                        }
                      }}
                      disabled={closeSessionMutation.isPending}
                      className="text-red-600 hover:text-red-900 focus:outline-none disabled:opacity-50 flex items-center justify-end w-full"
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
