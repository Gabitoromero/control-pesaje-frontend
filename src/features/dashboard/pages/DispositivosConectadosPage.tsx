import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dispositivosApi } from '../../../api/dispositivos';
import type { Dispositivo } from '../../../api/dispositivos';
import { useDialog } from '../../../components/dialogs/useDialog';
import { Edit, Trash } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export const DispositivosConectadosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { alertError, confirm } = useDialog();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Dispositivo | null>(null);
  const [formData, setFormData] = useState({ nombre: '' });

  const { data: devices = [], isLoading: loading, isError } = useQuery({
    queryKey: ['dispositivos'],
    queryFn: dispositivosApi.getConectados,
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: (hardwareId: string) => dispositivosApi.deleteDispositivo(hardwareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
    },
    onError: (err) => {
      console.error('Failed to delete dispositivo:', err);
      alertError({
        title: 'Error al eliminar',
        description: 'No se pudo eliminar el dispositivo.',
      });
    }
  });

  const handleDelete = async (hardwareId: string) => {
    const confirmed = await confirm({
      title: '¿Eliminar dispositivo?',
      description: `¿Desea eliminar el dispositivo con Hardware ID "${hardwareId}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
    
    if (confirmed) {
      deleteMutation.mutate(hardwareId);
      closeEditModal();
    }
  };

  const openEditModal = (device: Dispositivo) => {
    setEditingDevice(device);
    setFormData({ nombre: device.nombre || '' });
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingDevice(null);
    setFormData({ nombre: '' });
  };

  const updateMutation = useMutation({
    mutationFn: ({ hardwareId, nombre }: { hardwareId: string, nombre: string }) =>
      dispositivosApi.updateDispositivo(hardwareId, { nombre }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
      closeEditModal();
    },
    onError: (err) => {
      console.error('Failed to update dispositivo:', err);
      alertError({
        title: 'Error al actualizar',
        description: 'No se pudo actualizar el dispositivo.',
      });
    }
  });

  const handleEditSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDevice) return;
    
    updateMutation.mutate({
      hardwareId: editingDevice.hardwareId,
      nombre: formData.nombre
    });
  };

  if (loading) {
    return <div className="p-6 text-foreground">Cargando dispositivos...</div>;
  }

  if (isError) {
    return <div className="p-6 text-destructive">No se pudieron cargar los dispositivos conectados.</div>;
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
                    Nombre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Hardware ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Línea de Producción
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Última Conexión
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {devices.map((device) => (
                  <tr key={device.hardwareId} className="hover:bg-accent even:bg-muted/40">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {device.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {device.hardwareId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {device.lineaNombre ?? '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          device.estado === 'Conectado'
                            ? 'bg-success-muted text-success'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {device.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {device.ultimaConexionAt ? new Date(device.ultimaConexionAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          title="Editar Dispositivo"
                          onClick={() => openEditModal(device)}
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeEditModal(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Dispositivo</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <label htmlFor="device-nombre" className="block text-sm font-medium text-foreground">Nombre</label>
                <input
                  id="device-nombre"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="mt-6 flex flex-row sm:justify-between w-full">
              <button
                type="button"
                className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors flex items-center gap-2"
                onClick={() => handleDelete(editingDevice?.hardwareId!)}
              >
                <Trash size={18} /> Eliminar
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={closeEditModal} className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-accent">
                  Cancelar
                </button>
                <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
