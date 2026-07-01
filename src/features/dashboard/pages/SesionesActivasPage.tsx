import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSesionesActivas } from '../../../api/auth';

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
  const { data: sessions = [], isLoading: loading, error } = useQuery<EnrichedSession[]>({
    queryKey: ['sesiones-activas'],
    queryFn: async () => {
      // Backend now returns legajo directly; no need for N+1 queries.
      const data = await getSesionesActivas();
      return data as EnrichedSession[];
    },
    refetchInterval: 3000, // Auto-refresh every 3 seconds
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
