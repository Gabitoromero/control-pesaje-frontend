import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEtapas,
  getEtapasInactivas,
  createEtapa,
  updateEtapa,
  deleteEtapa,
  type Etapa,
  type EtapaCreate,
} from '../../../api/etapas';
import { Plus, Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { SearchToolbar, type SearchField } from '../../../components/SearchToolbar';
import { useActividadGlobal } from '../hooks/useActividadGlobal';

import { useDialog } from '../../../components/dialogs/useDialog';
import { getApiErrorMessage } from '../../../utils/errors';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const EMPTY_FORM = { nombre: '', descripcion: '' };

const ETAPA_FIELDS: SearchField[] = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'descripcion', label: 'Descripción' },
];

export const EtapasPage = () => {
  const queryClient = useQueryClient();
  const { confirm, alertError } = useDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<Etapa | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [status, setStatus] = useState<'activo' | 'inactivo'>('activo');
  const [field, setField] = useState('nombre');
  const [query, setQuery] = useState('');

  const { hayActividad } = useActividadGlobal();


  const { data: activas = [], isLoading: loadingActivas, error: errorActivas } = useQuery({
    queryKey: ['etapas'],
    queryFn: getEtapas,
  });

  const { data: inactivas = [], isLoading: loadingInactivas, error: errorInactivas } = useQuery({
    queryKey: ['etapas-inactivas'],
    queryFn: getEtapasInactivas,
  });

  const isLoading = loadingActivas || loadingInactivas;
  const error = errorActivas || errorInactivas;

  const etapasFiltradas = useMemo(() => {
    const base = status === 'activo' ? activas : inactivas;
    const q = query.trim().toLowerCase();

    let result = base;
    if (q) {
      result = base.filter((e) =>
        String(e[field as keyof Etapa] ?? '').toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [activas, inactivas, status, field, query]);

  const createMutation = useMutation({
    mutationFn: createEtapa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapas'] });
      queryClient.invalidateQueries({ queryKey: ['etapas-inactivas'] });
      closeModal();
      toast.success('Etapa creada exitosamente');
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo crear la etapa',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EtapaCreate> & { activo?: boolean }; accion: 'actualizada' | 'activada' }) =>
      updateEtapa(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['etapas'] });
      queryClient.invalidateQueries({ queryKey: ['etapas-inactivas'] });
      closeModal();
      toast.success(`Etapa ${variables.accion} exitosamente`);
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo guardar la etapa',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEtapa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapas'] });
      queryClient.invalidateQueries({ queryKey: ['etapas-inactivas'] });
      closeModal();
      toast.success('Etapa eliminada exitosamente');
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo eliminar la etapa',
        description: `${getApiErrorMessage(err, 'Ocurrió un error inesperado')}\n\nNota de sistema: No podés eliminar entidades que ya están asociadas a Rutas en el sistema.`,
      });
    },
  });

  const openModal = (etapa?: Etapa) => {
    if (etapa) {
      setEditingEtapa(etapa);
      setFormData({ nombre: etapa.nombre, descripcion: etapa.descripcion || '' });
    } else {
      setEditingEtapa(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEtapa(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingEtapa?.id) {
      updateMutation.mutate({
        id: editingEtapa.id,
        data: { nombre: formData.nombre, descripcion: formData.descripcion.trim() || null },
        accion: 'actualizada',
      });
    } else {
      createMutation.mutate({ nombre: formData.nombre, descripcion: formData.descripcion || undefined, activo: true });
    }
  };

  const handleDelete = async () => {
    if (!editingEtapa?.id) return;
    const confirmed = await confirm({
      title: '¿Está seguro de eliminar esta etapa?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(editingEtapa.id);
    }
  };

  const handleActivar = () => {
    if (!editingEtapa?.id) return;
    updateMutation.mutate({
      id: editingEtapa.id,
      data: {
        nombre: formData.nombre,
        descripcion: formData.descripcion.trim() || null,
        activo: true,
      },
      accion: 'activada',
    });
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <div className="p-6 text-foreground">Cargando etapas...</div>;
  if (error) return <div className="p-6 text-destructive">Error al cargar etapas</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gestión de Etapas</h1>
        <button
          onClick={() => openModal()}
          disabled={hayActividad}
          title={hayActividad ? 'No se pueden crear etapas mientras haya pasadas o sesiones activas' : ''}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} /> Nueva Etapa
        </button>
      </div>

      <SearchToolbar
        status={status}
        onStatusChange={setStatus}
        fields={ETAPA_FIELDS}
        field={field}
        onFieldChange={setField}
        query={query}
        onQueryChange={setQuery}
      />

      {hayActividad && (
        <div className="mb-6 p-4 bg-warning/20 border border-warning/50 rounded-md text-warning-foreground">
          <p className="font-semibold flex items-center gap-2">
            ⚠️ Bloqueo de seguridad activo
          </p>
          <p className="text-sm mt-1">
            No se permite crear, editar o eliminar etapas mientras haya pasadas o sesiones activas en el sistema.
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {etapasFiltradas.map((etapa) => (
                <tr key={etapa.id} className={`hover:bg-accent even:bg-muted/40 ${etapa.activo === false ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{etapa.nombre}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{etapa.descripcion || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${etapa.activo !== false ? 'bg-success-muted text-success' : 'bg-muted text-muted-foreground'}`}>
                      {etapa.activo !== false ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => openModal(etapa)} 
                      disabled={hayActividad}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed" 
                      title={hayActividad ? 'Bloqueado por actividad en el sistema' : 'Editar'}
                    >
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {etapasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">No hay etapas {status === 'activo' ? 'activas' : 'inactivas'}.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEtapa ? 'Editar Etapa' : 'Nueva Etapa'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="etapa-nombre" className="block text-sm font-medium text-foreground">Nombre</label>
                <input
                  id="etapa-nombre"
                  type="text"
                  required
                  placeholder="Ej: Amasado"
                  className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="etapa-descripcion" className="block text-sm font-medium text-foreground">Descripción <span className="text-muted-foreground font-normal">(opcional)</span></label>
                <textarea
                  id="etapa-descripcion"
                  className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  rows={3}
                  minLength={4}
                  placeholder="Ej: Proceso de preparación inicial de la masa"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="mt-6 flex justify-end gap-3">
              {editingEtapa?.activo === false && (
                <button type="button" disabled={isBusy} onClick={handleActivar}
                  className="px-4 py-2 bg-success text-white rounded-md hover:bg-success/90 disabled:opacity-50 mr-auto">
                  Activar Etapa
                </button>
              )}
              {editingEtapa?.id && editingEtapa?.activo !== false && (
                <button type="button" disabled={isBusy || deleteMutation.isPending} onClick={handleDelete}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 mr-auto flex items-center gap-2">
                  <Trash size={18} /> {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar Etapa'}
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
