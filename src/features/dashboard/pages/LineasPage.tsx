import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLineas,
  getLineasInactivas,
  createLinea,
  updateLinea,
  deleteLinea,
  type Linea,
  type LineaCreate,
} from '../../../api/lineas';
import { getRutas } from '../../../api/rutas';
import { Plus, Edit, Trash } from 'lucide-react';
import { SearchToolbar, type SearchField } from '../../../components/SearchToolbar';
import { useDialog } from '../../../components/dialogs/useDialog';
import { getApiErrorMessage } from '../../../utils/errors';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const EMPTY_FORM = { nombre: '', numeroBalanza: 1, rutaPasadaActiva: '' };

const LINEA_FIELDS: SearchField[] = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'numeroBalanza', label: 'N° Balanza' },
];

export const LineasPage = () => {
  const queryClient = useQueryClient();
  const { alertSuccess, alertWarning, alertError, confirm } = useDialog();

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

  const createMutation = useMutation({
    mutationFn: createLinea,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      queryClient.invalidateQueries({ queryKey: ['lineas-inactivos'] });
      closeModal();
      notifyOutcome('creada', variables.rutaPasadaActiva);
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo crear la línea',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: {
      id: number;
      data: Partial<LineaCreate> & { activo?: boolean };
      accion: 'actualizada' | 'activada';
    }) => updateLinea(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      queryClient.invalidateQueries({ queryKey: ['lineas-inactivos'] });
      closeModal();
      notifyOutcome(variables.accion, variables.data.rutaPasadaActiva);
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo guardar la línea',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
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
      alertError({
        title: 'No se pudo eliminar la línea',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const openModal = (linea?: Linea) => {
    if (linea) {
      setEditingLinea(linea);
      setFormData({
        nombre: linea.nombre,
        numeroBalanza: linea.numeroBalanza,
        rutaPasadaActiva: linea.rutaPasadaActiva?.id?.toString() || '',
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
          numeroBalanza: Number(formData.numeroBalanza),
          rutaPasadaActiva: formData.rutaPasadaActiva ? Number(formData.rutaPasadaActiva) : null,
        },
        accion: 'actualizada',
      });
    } else {
      createMutation.mutate({
        nombre: formData.nombre,
        numeroBalanza: Number(formData.numeroBalanza),
        rutaPasadaActiva: formData.rutaPasadaActiva ? Number(formData.rutaPasadaActiva) : undefined,
        activo: true,
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
        numeroBalanza: Number(formData.numeroBalanza),
        rutaPasadaActiva: formData.rutaPasadaActiva ? Number(formData.rutaPasadaActiva) : null,
        activo: true,
      },
      accion: 'activada',
    });
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <div className="p-6 text-foreground">Cargando líneas...</div>;
  if (error) return <div className="p-6 text-destructive">Error al cargar líneas</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gestión de Líneas</h1>
        <button
          onClick={() => openModal()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2"
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

      <div className="bg-card border border-border rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">N° Balanza</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ruta Activa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {lineasFiltradas.map((linea) => (
                <tr key={linea.id} className={`hover:bg-accent even:bg-muted/40 ${linea.activo === false ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{linea.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{linea.numeroBalanza}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{linea.rutaPasadaActiva?.nombre ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${linea.activo !== false ? 'bg-success-muted text-success' : 'bg-muted text-muted-foreground'}`}>
                      {linea.activo !== false ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openModal(linea)} className="text-muted-foreground hover:text-foreground" title="Editar">
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
              <div>
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
              <div>
                <label htmlFor="linea-balanza" className="block text-sm font-medium text-foreground">Número de Balanza</label>
                <input
                  id="linea-balanza"
                  type="number"
                  required
                  min="1"
                  className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.numeroBalanza}
                  onChange={(e) => setFormData({ ...formData, numeroBalanza: Number(e.target.value) })}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="linea-ruta" className="block text-sm font-medium text-foreground">Ruta Activa <span className="text-muted-foreground font-normal">(opcional)</span></label>
                <select
                  id="linea-ruta"
                  className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.rutaPasadaActiva}
                  onChange={(e) => setFormData({ ...formData, rutaPasadaActiva: e.target.value })}
                >
                  <option value="">-- Sin ruta --</option>
                  {rutas.map((ruta) => (
                    <option key={ruta.id} value={ruta.id}>{ruta.nombre}</option>
                  ))}
                </select>
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
