import React, { useEffect, useState } from 'react';
import { dispositivosApi } from '../../../api/dispositivos';
import type { ConnectedDevice } from '../../../api/dispositivos';

export const DispositivosConectadosPage: React.FC = () => {
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = await dispositivosApi.getConectados();
        setDevices(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dispositivos conectados:', err);
        setError('No se pudieron cargar los dispositivos conectados.');
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();

    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500">Cargando dispositivos...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Dispositivos Conectados (Raspberry Pi)</h2>
      {devices.length === 0 ? (
        <p className="text-gray-500">No hay dispositivos conectados.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Línea de Producción
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Socket ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conectado Desde
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {devices.map((device) => (
                <tr key={device.socketId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{device.lineaId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{device.socketId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(device.timestamp).toLocaleString()}
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
