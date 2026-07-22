import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLineas,
  getLineasInactivas,
  createLinea,
  updateLinea,
  deleteLinea,
  assignDeviceToLinea,
  type Linea,
  type LineaCreate,
} from '../../../api/lineas';
import { getRutas } from '../../../api/rutas';
import { dispositivosApi } from '../../../api/dispositivos';
import { Plus, Edit, Trash } from 'lucide-react';
import { SearchToolbar, type SearchField } from '../../../components/SearchToolbar';
import { useDialog } from '../../../components/dialogs/useDialog';
import { getApiErrorMessage } from '../../../utils/errors';
import { toast } from 'sonner';
import { SearchableCombobox } from '../../../components/ui/SearchableCombobox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useActividadGlobal } from '../hooks/useActividadGlobal';


const EMPTY_FORM = { nombre: '', rutaPasadaActiva: '', dispositivoHardwareId: '' };

const LINEA_FIELDS: SearchField[] = [
  { value: 'nombre', label: 'Nombre' },
];

export const LineasPage = () => {
  const queryClient = useQueryClient();
  const { alertSuccess, alertWarning, confirm } = useDialog();

  const notifyOutcome = (accion: 'creada' | 'actualizada' | 'activada', rutaPasadaActiva: number | null | undefined) => {
    if (rutaPasadaActiva) {
      alertSuccess({ title: `Línea ${accion} exitosamente` });
    } else {
      alertWarning({
        title: `Línea ${accion} sin ruta activa`,
        description: 'La línea fue guardada correctamente, pero no tiene una ruta de pasada activa asignada.',
      });
    }
  };
  
  const { hayActividad } = useActividadGlobal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLinea, setEditingLinea] = useState<Linea | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [status, setStatus] = useState<'activo' | 'inactivo'>('activo');
  const [field, setField] = useState('nombre');
  const [query, setQuery] = useState('');

  const { data: activas = [], isLoading: loadingActivas, error: errorActivas } = useQuery({
    queryKey: ['lineas'],
    queryFn: getLineas,
  });

  const { data: inactivas = [], isLoading: loadingInactivas, error: errorInactivas } = useQuery({
    queryKey: ['lineas-inactivos'],
    queryFn: getLineasInactivas,
  });

  const { data: rutas = [] } = useQuery({
    queryKey: ['rutas'],
    queryFn: getRutas,
  });

  const { data: dispositivos = [] } = useQuery({
    queryKey: ['dispositivos'],
    queryFn: dispositivosApi.getConectados,
  });

  const isLoading = loadingActivas || loadingInactivas;
  const error = errorActivas || errorInactivas;

  const lineasFiltradas = useMemo(() => {
    const base = status === 'activo' ? activas : inactivas;
    const q = query.trim().toLowerCase();

    let result = base;
    if (q) {
      result = base.filter((l) =>
        String(l[field as keyof Linea] ?? '').toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [activas, inactivas, status, field, query]);

  const saveDeviceMutation = useMutation({
    mutationFn: ({ id, hardwareId }: { id: number; hardwareId: string | null }) => 
      assignDeviceToLinea(id, hardwareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      queryClient.invalidateQueries({ queryKey: ['lineas-inactivos'] });
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
    },
    onError: (err: unknown) => {
      toast.error('Error al asignar dispositivo', {
        description: getApiErrorMessage(err, 'El dispositivo puede estar asignado a otra línea.'),
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: LineaCreate & { activo?: boolean, dispositivoHardwareId?: string }) => {
      const linea = await createLinea(data);
      if (data.dispositivoHardwareId && linea.id) {
        try {
          await saveDeviceMutation.mutateAsync({ id: linea.id, hardwareId: data.dispositivoHardwareId });
        } catch (err) {
          (err as Record<string, unknown>).__deviceError = true;
          throw err;
        }
      }
      return linea;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      queryClient.invalidateQueries({ queryKey: ['lineas-inactivos'] });
      closeModal();
      notifyOutcome('creada', variables.rutaPasadaActiva);
    },
    onError: (err: unknown) => {
      if ((err as Record<string, unknown>)?.__deviceError) return;
      toast.error('No se pudo crear la línea', {
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, hardwareId }: {
      id: number;
      data: Partial<LineaCreate> & { activo?: boolean };
      hardwareId?: string;
      accion: 'actualizada' | 'activada';
    }) => {
      const linea = await updateLinea(id, data);
      
      const originalHardwareId = editingLinea?.dispositivo?.hardwareId || '';
      if (hardwareId !== undefined && hardwareId !== originalHardwareId) {
        try {
          await saveDeviceMutation.mutateAsync({ id, hardwareId: hardwareId === '' ? null : hardwareId });
        } catch (err) {
          // saveDeviceMutation.onError already shows its own toast.
          // Mark the error so updateMutation.onError doesn't duplicate it.
          const marked = err instanceof Error ? err : new Error(String(err));
          (marked as unknown as Record<string, unknown>).__deviceError = true;
          throw marked;
        }
      }
      return linea;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      queryClient.invalidateQueries({ queryKey: ['lineas-inactivos'] });
      closeModal();
      notifyOutcome(variables.accion, variables.data.rutaPasadaActiva);
    },
    onError: (err: unknown) => {
      // saveDeviceMutation already handles its own errors with a toast
      if ((err as Record<string, unknown>)?.__deviceError) return;
      toast.error('No se pudo guardar la línea', {
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado al guardar la línea.'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLinea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      queryClient.invalidateQueries({ queryKey: ['lineas-inactivos'] });
      closeModal();
    },
    onError: (err: unknown) => {
      toast.error('No se pudo eliminar la línea', {
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const openModal = (linea?: Linea) => {
    if (linea) {
      setEditingLinea(linea);
      setFormData({
        nombre: linea.nombre,
        rutaPasadaActiva: linea.rutaPasadaActiva?.id?.toString() || '',
        dispositivoHardwareId: linea.dispositivo?.hardwareId || '',
      });
    } else {
      setEditingLinea(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLinea(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (editingLinea?.id) {
      updateMutation.mutate({
        id: editingLinea.id,
        data: {
          nombre: formData.nombre,
          rutaPasadaActiva: formData.rutaPasadaActiva ? Number(formData.rutaPasadaActiva) : null,
        },
        hardwareId: formData.dispositivoHardwareId,
        accion: 'actualizada',
      });
    } else {
      createMutation.mutate({
        nombre: formData.nombre,
        rutaPasadaActiva: formData.rutaPasadaActiva ? Number(formData.rutaPasadaActiva) : undefined,
        activo: true,
        dispositivoHardwareId: formData.dispositivoHardwareId,
      });
    }
  };

  const handleDelete = async () => {
    if (!editingLinea?.id) return;
    const confirmed = await confirm({
      title: '¿Está seguro de eliminar esta línea?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(editingLinea.id);
    }
  };

  const handleActivar = () => {
    if (!editingLinea?.id) return;
    updateMutation.mutate({
      id: editingLinea.id,
      data: {
        nombre: formData.nombre,
        rutaPasadaActiva: formData.rutaPasadaActiva ? Number(formData.rutaPasadaActiva) : null,
        activo: true,
      },
      hardwareId: formData.dispositivoHardwareId,
      accion: 'activada',
    });
  };

  const isBusy = createMutation.isPending || updateMutation.isPending || saveDeviceMutation.isPending;

  if (isLoading) return <div className="p-6 text-foreground">Cargando líneas...</div>;
  if (error) return <div className="p-6 text-destructive">Error al cargar líneas</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gestión de Líneas</h1>
        <button
          onClick={() => openModal()}
          disabled={hayActividad}
          title={hayActividad ? 'No se pueden crear líneas mientras haya pasadas o sesiones activas' : ''}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} /> Nueva Línea
        </button>
      </div>

      <SearchToolbar
        status={status}
        onStatusChange={setStatus}
        fields={LINEA_FIELDS}
        field={field}
        onFieldChange={setField}
        query={query}
        onQueryChange={setQuery}
      />

      {hayActividad && (
        <div className="mb-6 p-4 bg-warning/20 border border-warning/50 rounded-md text-foreground">
          <p className="font-semibold flex items-center gap-2">
            ⚠️ Bloqueo de seguridad activo
          </p>
          <p className="text-sm mt-1">
            No se permite crear, editar o eliminar líneas mientras haya pasadas o sesiones activas en el sistema.
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Dispositivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ruta Activa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {lineasFiltradas.map((linea) => (
                <tr key={linea.id} className={`hover:bg-accent even:bg-muted/40 ${linea.activo === false ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{linea.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {linea.dispositivo ? `${linea.dispositivo.nombre} (${linea.dispositivo.hardwareId.slice(0, 8)})` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{linea.rutaPasadaActiva?.nombre ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${linea.activo !== false ? 'bg-success-muted text-success' : 'bg-muted text-muted-foreground'}`}>
                      {linea.activo !== false ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => openModal(linea)} 
                      disabled={hayActividad}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed" 
                      title={hayActividad ? 'Bloqueado por actividad en el sistema' : 'Editar'}
                    >
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {lineasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">No hay líneas de producción {status === 'activo' ? 'activas' : 'inactivas'}.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLinea ? 'Editar Línea' : 'Nueva Línea'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="linea-nombre" className="block text-sm font-medium text-foreground">Nombre</label>
                <input
                  id="linea-nombre"
                  type="text"
                  required
                  placeholder="Ej: Línea 1 — Envasado A"
                  className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Dispositivo <span className="text-muted-foreground font-normal">(opcional)</span></label>
                <SearchableCombobox
                  value={formData.dispositivoHardwareId}
                  onChange={(val) => setFormData({ ...formData, dispositivoHardwareId: (val as string) || '' })}
                  options={dispositivos.map((device) => ({ id: device.hardwareId, nombre: `${device.nombre} (${device.hardwareId.slice(0, 8)})` }))}
                  placeholder="Buscar dispositivo..."
                  clearable
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Ruta Activa <span className="text-muted-foreground font-normal">(opcional)</span></label>
                <SearchableCombobox
                  value={formData.rutaPasadaActiva ? Number(formData.rutaPasadaActiva) : null}
                  onChange={(val) => setFormData({ ...formData, rutaPasadaActiva: val ? String(val) : '' })}
                  options={rutas}
                  placeholder="Buscar ruta..."
                  clearable
                />
              </div>
            </div>
            <DialogFooter className="mt-6 flex justify-end gap-3">
              {editingLinea?.activo === false && (
                <button type="button" disabled={isBusy} onClick={handleActivar}
                  className="px-4 py-2 bg-success text-white rounded-md hover:bg-success/90 disabled:opacity-50 mr-auto">
                  Activar Línea
                </button>
              )}
              {editingLinea?.id && editingLinea?.activo !== false && (
                <button type="button" disabled={isBusy || deleteMutation.isPending} onClick={handleDelete}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 mr-auto flex items-center gap-2">
                  <Trash size={18} /> {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar Línea'}
                </button>
              )}
              <button type="button" onClick={closeModal} className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-accent">
                Cancelar
              </button>
              <button type="submit" disabled={isBusy} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
                {isBusy ? 'Guardando...' : 'Guardar'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
