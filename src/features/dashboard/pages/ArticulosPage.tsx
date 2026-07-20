import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getArticulos,
  getArticulosInactivos,
  createArticulo,
  updateArticulo,
  deleteArticulo,
  type Articulo,
} from '../../../api/articulos';
import { Plus, Edit, Trash } from 'lucide-react';
import { SearchToolbar, type SearchField } from '../../../components/SearchToolbar';
import { useDialog } from '../../../components/dialogs/useDialog';
import { getApiErrorMessage } from '../../../utils/errors';
import { useActividadGlobal } from '../hooks/useActividadGlobal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const EMPTY_FORM = { nombre: '', descripcion: '', marca: '' };

const ARTICULO_FIELDS: SearchField[] = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'marca', label: 'Marca' },
  { value: 'descripcion', label: 'Descripción' },
];

export const ArticulosPage = () => {
  const queryClient = useQueryClient();
  const { alertError, confirm } = useDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticulo, setEditingArticulo] = useState<Articulo | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const { hayActividad } = useActividadGlobal();

  const [status, setStatus] = useState<'activo' | 'inactivo'>('activo');
  const [field, setField] = useState('nombre');
  const [query, setQuery] = useState('');

  const { data: activos = [], isLoading: loadingActivos, error: errorActivos } = useQuery({
    queryKey: ['articulos'],
    queryFn: getArticulos,
  });

  const { data: inactivos = [], isLoading: loadingInactivos, error: errorInactivos } = useQuery({
    queryKey: ['articulos-inactivos'],
    queryFn: getArticulosInactivos,
  });

  const isLoading = loadingActivos || loadingInactivos;
  const error = errorActivos || errorInactivos;

  const articulosFiltrados = useMemo(() => {
    const base = status === 'activo' ? activos : inactivos;
    const q = query.trim().toLowerCase();

    let result = base;
    if (q) {
      result = base.filter((a) =>
        String(a[field as keyof Articulo] ?? '').toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [activos, inactivos, status, field, query]);

  const createMutation = useMutation({
    mutationFn: createArticulo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articulos'] });
      queryClient.invalidateQueries({ queryKey: ['articulos-inactivos'] });
      closeModal();
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo crear el artículo',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Articulo> }) => updateArticulo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articulos'] });
      queryClient.invalidateQueries({ queryKey: ['articulos-inactivos'] });
      closeModal();
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo guardar el artículo',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteArticulo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articulos'] });
      queryClient.invalidateQueries({ queryKey: ['articulos-inactivos'] });
      closeModal();
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo eliminar el artículo',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const openModal = (articulo?: Articulo) => {
    if (articulo) {
      setEditingArticulo(articulo);
      setFormData({
        nombre: articulo.nombre,
        descripcion: articulo.descripcion || '',
        marca: articulo.marca || '',
      });
    } else {
      setEditingArticulo(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingArticulo(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingArticulo?.id) {
      updateMutation.mutate({
        id: editingArticulo.id,
        data: { nombre: formData.nombre, marca: formData.marca || undefined, descripcion: formData.descripcion.trim() || null },
      });
    } else {
      createMutation.mutate({ nombre: formData.nombre, marca: formData.marca || undefined, descripcion: formData.descripcion || undefined, activo: true });
    }
  };

  const handleDelete = async () => {
    if (!editingArticulo?.id) return;
    const confirmed = await confirm({
      title: '¿Está seguro de eliminar este artículo?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(editingArticulo.id);
    }
  };

  const handleActivar = () => {
    if (!editingArticulo?.id) return;
    updateMutation.mutate({
      id: editingArticulo.id,
      data: {
        nombre: formData.nombre,
        marca: formData.marca || undefined,
        descripcion: formData.descripcion.trim() || null,
        activo: true,
      },
    });
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <div className="p-6 text-foreground">Cargando artículos...</div>;
  if (error) return <div className="p-6 text-destructive">Error al cargar artículos</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gestión de Artículos</h1>
        <button
          onClick={() => openModal()}
          disabled={hayActividad}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title={hayActividad ? 'Bloqueado por actividad en el sistema' : ''}
        >
          <Plus size={18} /> Nuevo Artículo
        </button>
      </div>

      {hayActividad && (
        <div className="mb-6 p-4 bg-warning/20 border border-warning/50 rounded-md text-foreground">
          <p className="font-semibold flex items-center gap-2">
            ⚠️ Bloqueo de seguridad activo
          </p>
          <p className="text-sm mt-1">
            No se pueden crear, editar ni eliminar artículos porque hay pasadas en curso o usuarios operando en línea.
          </p>
        </div>
      )}

      <SearchToolbar
        status={status}
        onStatusChange={setStatus}
        fields={ARTICULO_FIELDS}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Marca</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {articulosFiltrados.map((articulo) => (
                <tr key={articulo.id} className={`hover:bg-accent even:bg-muted/40 ${articulo.activo === false ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{articulo.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{articulo.marca || '-'}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{articulo.descripcion || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${articulo.activo !== false ? 'bg-success-muted text-success' : 'bg-muted text-muted-foreground'}`}>
                      {articulo.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => openModal(articulo)} 
                      disabled={hayActividad}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed" 
                      title={hayActividad ? 'Bloqueado por actividad en el sistema' : 'Editar'}
                    >
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {articulosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">No hay artículos {status === 'activo' ? 'activos' : 'inactivos'}.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingArticulo ? 'Editar Artículo' : 'Nuevo Artículo'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="articulo-nombre" className="block text-sm font-medium text-foreground">Nombre</label>
                <input
                  id="articulo-nombre"
                  type="text"
                  required
                  placeholder="Ej: Palito bombón"
                  className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="articulo-marca" className="block text-sm font-medium text-foreground">Marca</label>
                <input
                  id="articulo-marca"
                  type="text"
                  required
                  placeholder="Ej: Arcor"
                  className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  value={formData.marca}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="articulo-descripcion" className="block text-sm font-medium text-foreground">Descripción <span className="text-muted-foreground font-normal">(opcional)</span></label>
                <textarea
                  id="articulo-descripcion"
                  className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  rows={3}
                  minLength={4}
                  placeholder="Ej: Caramelo sabor frutilla en palito"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="mt-6 flex justify-end gap-3">
              {editingArticulo?.activo === false && (
                <button type="button" disabled={isBusy} onClick={handleActivar}
                  className="px-4 py-2 bg-success text-white rounded-md hover:bg-success/90 disabled:opacity-50 mr-auto">
                  Activar Artículo
                </button>
              )}
              {editingArticulo?.id && editingArticulo?.activo !== false && (
                <button type="button" disabled={isBusy || deleteMutation.isPending} onClick={handleDelete}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 mr-auto flex items-center gap-2">
                  <Trash size={18} /> {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar Artículo'}
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
