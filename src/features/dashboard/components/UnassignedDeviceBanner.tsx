import React, { useEffect, useState } from 'react';
import { getSocket } from '../../../services/websocket';
import { AlertTriangle, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { getLineas, assignDeviceToLinea } from '../../../api/lineas';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const UnassignedDeviceBanner: React.FC = () => {
  const [unassignedDevices, setUnassignedDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLinea, setSelectedLinea] = useState<number | ''>('');

  const queryClient = useQueryClient();

  const { data: lineas } = useQuery({
    queryKey: ['lineas'],
    queryFn: getLineas,
  });

  const mutation = useMutation({
    mutationFn: (variables: { id: number; hardwareId: string }) =>
      assignDeviceToLinea(variables.id, variables.hardwareId),
    onSuccess: (_, variables) => {
      toast.success('Dispositivo asignado exitosamente');
      setUnassignedDevices((prev) => prev.filter((d) => d !== variables.hardwareId));
      setIsModalOpen(false);
      setSelectedLinea('');
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
    },
    onError: () => {
      toast.error('Error al asignar el dispositivo');
    },
  });

  useEffect(() => {
    const socket = getSocket();

    const handleUnknownDevice = (data: { hardwareId: string }) => {
      if (!data || !data.hardwareId) return;
      setUnassignedDevices((prev) => {
        if (!prev.includes(data.hardwareId)) {
          return [...prev, data.hardwareId];
        }
        return prev;
      });
    };

    socket.on('unknown-device-connected', handleUnknownDevice);

    return () => {
      socket.off('unknown-device-connected', handleUnknownDevice);
    };
  }, []);

  if (unassignedDevices.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 space-y-2">
        {unassignedDevices.map((deviceId) => (
          <div key={deviceId} className="bg-amber-100 border-l-4 border-amber-500 text-amber-900 p-4 shadow-lg rounded flex items-center justify-between min-w-[300px]">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-bold text-sm">Dispositivo no asignado</p>
                <p className="text-xs">ID: {deviceId}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedDevice(deviceId);
                setIsModalOpen(true);
              }}
              className="ml-4 bg-amber-500 text-white p-2 rounded hover:bg-amber-600 transition-colors flex-shrink-0"
              title="Asignar a línea"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Dispositivo</DialogTitle>
            <DialogDescription>
              Seleccione la línea de producción a la cual asignar el dispositivo con ID: <strong>{selectedDevice}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="block text-sm font-medium mb-1">Línea de Producción</label>
            <select
              className="w-full border rounded-md p-2 bg-background text-foreground"
              value={selectedLinea}
              onChange={(e) => setSelectedLinea(Number(e.target.value))}
            >
              <option value="" disabled>Seleccione una línea</option>
              {lineas?.map((linea) => (
                <option key={linea.id} value={linea.id}>
                  {linea.nombre}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <button
              className="px-4 py-2 border rounded-md text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => setIsModalOpen(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
              onClick={() => {
                if (selectedLinea && selectedDevice) {
                  mutation.mutate({ id: Number(selectedLinea), hardwareId: selectedDevice });
                }
              }}
              disabled={!selectedLinea || mutation.isPending}
            >
              {mutation.isPending ? 'Asignando...' : 'Asignar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
