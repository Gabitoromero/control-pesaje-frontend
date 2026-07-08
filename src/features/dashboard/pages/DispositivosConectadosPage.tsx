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
    return <div className="p-6 text-foreground">Cargando dispositivos...</div>;
  }

  if (error) {
    return <div className="p-6 text-destructive">{error}</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Dispositivos Conectados (Raspberry Pi)</h2>
      {devices.length === 0 ? (
        <p className="text-muted-foreground">No hay dispositivos conectados.</p>
      ) : (
        <div className="bg-card border border-border rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Línea de Producción
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Socket ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Conectado Desde
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {devices.map((device) => (
                  <tr key={device.socketId} className="hover:bg-accent even:bg-muted/40">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {device.lineaId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {device.socketId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(device.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-success-muted text-success">
                        Conectado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
