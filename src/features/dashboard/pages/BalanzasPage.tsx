import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBalanzas,
  getBalanzasInactivas,
  createBalanza,
  updateBalanza,
  deleteBalanza,
  type BalanzaCreate,
} from '../../../api/balanzas';
import type { Balanza } from '../../../shared/types/domain';
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

const EMPTY_FORM = { nombre: '' };

const BALANZA_FIELDS: SearchField[] = [
  { value: 'nombre', label: 'Nombre' },
];

export const BalanzasPage = () => {
  const queryClient = useQueryClient();
  const { confirm, alertError } = useDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBalanza, setEditingBalanza] = useState<Balanza | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [status, setStatus] = useState<'activo' | 'inactivo'>('activo');
  const [field, setField] = useState('nombre');
  const [query, setQuery] = useState('');

  const { hayActividad } = useActividadGlobal();

  const { data: activas = [], isLoading: loadingActivas, error: errorActivas } = useQuery({
    queryKey: ['balanzas'],
    queryFn: getBalanzas,
  });

  const { data: inactivas = [], isLoading: loadingInactivas, error: errorInactivas } = useQuery({
    queryKey: ['balanzas-inactivas'],
    queryFn: getBalanzasInactivas,
  });

  const isLoading = loadingActivas || loadingInactivas;
  const error = errorActivas || errorInactivas;

  const balanzasFiltradas = useMemo(() => {
    const base = status === 'activo' ? activas : inactivas;
    const q = query.trim().toLowerCase();

    let result = base;
    if (q) {
      result = base.filter((b) =>
        String(b[field as keyof Balanza] ?? '').toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [activas, inactivas, status, field, query]);

  const createMutation = useMutation({
    mutationFn: createBalanza,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balanzas'] });
      queryClient.invalidateQueries({ queryKey: ['balanzas-inactivas'] });
      closeModal();
      toast.success('Balanza creada exitosamente');
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo crear la balanza',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BalanzaCreate>; accion: 'actualizada' | 'activada' }) =>
      updateBalanza(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['balanzas'] });
      queryClient.invalidateQueries({ queryKey: ['balanzas-inactivas'] });
      closeModal();
      toast.success(`Balanza ${variables.accion} exitosamente`);
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo guardar la balanza',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBalanza,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balanzas'] });
      queryClient.invalidateQueries({ queryKey: ['balanzas-inactivas'] });
      closeModal();
      toast.success('Balanza eliminada exitosamente');
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo eliminar la balanza',
        description: `${getApiErrorMessage(err, 'Ocurrió un error inesperado')}\n\nNota de sistema: No podés eliminar una balanza que está asignada a una línea o usada en pasadas. Desactivala en su lugar.`,
      });
    },
  });

  const openModal = (balanza?: Balanza) => {
    if (balanza) {
      setEditingBalanza(balanza);
      setFormData({ nombre: balanza.nombre });
    } else {
      setEditingBalanza(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBalanza(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingBalanza?.id) {
      updateMutation.mutate({
        id: editingBalanza.id,
        data: { nombre: formData.nombre },
        accion: 'actualizada',
      });
    } else {
      createMutation.mutate({ nombre: formData.nombre, activo: true });
    }
  };

  const handleDelete = async () => {
    if (!editingBalanza?.id) return;
    const confirmed = await confirm({
      title: '¿Está seguro de eliminar esta balanza?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(editingBalanza.id);
    }
  };

  const handleActivar = () => {
    if (!editingBalanza?.id) return;
    updateMutation.mutate({
      id: editingBalanza.id,
      data: { nombre: formData.nombre, activo: true },
      accion: 'activada',
    });
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <div className="p-6 text-foreground">Cargando balanzas...</div>;
  if (error) return <div className="p-6 text-destructive">Error al cargar balanzas</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gestión de Balanzas</h1>
        <button
          onClick={() => openModal()}
          disabled={hayActividad}
          title={hayActividad ? 'No se pueden crear balanzas mientras haya pasadas o sesiones activas' : ''}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} /> Nueva Balanza
        </button>
      </div>

      <SearchToolbar
        status={status}
        onStatusChange={setStatus}
        fields={BALANZA_FIELDS}
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
            No se permite crear, editar o eliminar balanzas mientras haya pasadas o sesiones activas en el sistema.
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {balanzasFiltradas.map((balanza) => (
                <tr key={balanza.id} className={`hover:bg-accent even:bg-muted/40 ${balanza.activo === false ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{balanza.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${balanza.activo !== false ? 'bg-success-muted text-success' : 'bg-muted text-muted-foreground'}`}>
                      {balanza.activo !== false ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(balanza)}
                      disabled={hayActividad}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                      title={hayActividad ? 'Bloqueado por actividad en el sistema' : 'Editar'}
                    >
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {balanzasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-muted-foreground">No hay balanzas {status === 'activo' ? 'activas' : 'inactivas'}.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBalanza ? 'Editar Balanza' : 'Nueva Balanza'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="balanza-nombre" className="block text-sm font-medium text-foreground">Nombre</label>
                <input
                  id="balanza-nombre"
                  type="text"
                  required
                  placeholder="Ej: Balanza 1"
                  className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="mt-6 flex justify-end gap-3">
              {editingBalanza?.activo === false && (
                <button type="button" disabled={isBusy} onClick={handleActivar}
                  className="px-4 py-2 bg-success text-white rounded-md hover:bg-success/90 disabled:opacity-50 mr-auto">
                  Activar Balanza
                </button>
              )}
              {editingBalanza?.id && editingBalanza?.activo !== false && (
                <button type="button" disabled={isBusy || deleteMutation.isPending} onClick={handleDelete}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 mr-auto flex items-center gap-2">
                  <Trash size={18} /> {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar Balanza'}
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
