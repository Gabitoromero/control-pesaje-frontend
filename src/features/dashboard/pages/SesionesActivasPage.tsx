import React, { useEffect, useState } from 'react';
import { getSesionesActivas } from '../../../api/auth';
import { getUsuario } from '../../../api/usuarios';

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
  const [sessions, setSessions] = useState<EnrichedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const data = await getSesionesActivas();
        
        const enrichedSessions: EnrichedSession[] = await Promise.all(
          data.map(async (session: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            let usuarioNombre = 'Desconocido';
            let legajo = '-';
            try {
              if (session.usuarioId) {
                const user = await getUsuario(session.usuarioId);
                usuarioNombre = user.nombreUsuario;
                legajo = user.legajo;
              }
            } catch (userErr) {
              console.error(`Failed to fetch user ${session.usuarioId}`, userErr);
            }
            
            return {
              lineaId: session.lineaId,
              lineaNombre: session.lineaNombre,
              usuarioId: session.usuarioId,
              usuarioNombre,
              legajo,
              fechaInicio: session.fechaInicio,
              expiraEn: session.expiraEn,
            };
          })
        );
        
        setSessions(enrichedSessions);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch sesiones activas:', err);
        setError('No se pudieron cargar las sesiones activas.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500">Cargando sesiones...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
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
