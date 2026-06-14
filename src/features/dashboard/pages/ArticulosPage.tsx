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
import { Plus, Edit, Trash, X } from 'lucide-react';
import { isAxiosError } from 'axios';
import { SearchToolbar, type SearchField } from '../../../components/SearchToolbar';

const EMPTY_FORM = { nombre: '', descripcion: '', marca: '' };

const ARTICULO_FIELDS: SearchField[] = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'marca', label: 'Marca' },
  { value: 'descripcion', label: 'Descripción' },
];

export const ArticulosPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticulo, setEditingArticulo] = useState<Articulo | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

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
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Articulo> }) => updateArticulo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articulos'] });
      queryClient.invalidateQueries({ queryKey: ['articulos-inactivos'] });
      closeModal();
    },
    onError: (err: unknown) => {
      let msg = 'Ocurrió un error inesperado';
      if (isAxiosError(err)) {
        msg = err.response?.data?.error?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`No se pudo guardar el artículo:\n${msg}`);
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
      let msg = 'Ocurrió un error inesperado';
      if (isAxiosError(err)) {
        msg = err.response?.data?.error?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`No se pudo eliminar el artículo:\n${msg}`);
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

  const handleDelete = () => {
    if (editingArticulo?.id && window.confirm('¿Está seguro de eliminar este artículo?')) {
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

  if (isLoading) return <div className="p-6">Cargando artículos...</div>;
  if (error) return <div className="p-6 text-red-500">Error al cargar artículos</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Artículos</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus size={18} /> Nuevo Artículo
        </button>
      </div>

      <SearchToolbar
        status={status}
        onStatusChange={setStatus}
        fields={ARTICULO_FIELDS}
        field={field}
        onFieldChange={setField}
        query={query}
        onQueryChange={setQuery}
      />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {articulosFiltrados.map((articulo) => (
              <tr key={articulo.id} className={`hover:bg-gray-50 ${articulo.activo === false ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{articulo.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{articulo.marca || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{articulo.descripcion || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${articulo.activo !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {articulo.activo !== false ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModal(articulo)} className="text-indigo-600 hover:text-indigo-900" title="Editar">
                    <Edit size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {articulosFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No hay artículos registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">{editingArticulo ? 'Editar Artículo' : 'Nuevo Artículo'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="articulo-nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    id="articulo-nombre"
                    type="text"
                    required
                    placeholder="Ej: Palito bombón"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="articulo-marca" className="block text-sm font-medium text-gray-700">Marca</label>
                  <input
                    id="articulo-marca"
                    type="text"
                    required
                    placeholder="Ej: Arcor"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="articulo-descripcion" className="block text-sm font-medium text-gray-700">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <textarea
                    id="articulo-descripcion"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
                    rows={3}
                    minLength={4}
                    placeholder="Ej: Caramelo sabor frutilla en palito"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                {editingArticulo?.activo === false && (
                  <button type="button" disabled={isBusy} onClick={handleActivar}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 mr-auto">
                    Activar Artículo
                  </button>
                )}
                {editingArticulo?.id && editingArticulo?.activo !== false && (
                  <button type="button" disabled={isBusy || deleteMutation.isPending} onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 mr-auto flex items-center gap-2">
                    <Trash size={18} /> {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar Artículo'}
                  </button>
                )}
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isBusy} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isBusy ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
