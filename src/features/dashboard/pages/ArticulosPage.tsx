import React, { useState } from 'react';
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

const EMPTY_FORM = { codigo: '', nombre: '', descripcion: '', marca: '' };

export const ArticulosPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticulo, setEditingArticulo] = useState<Articulo | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

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
  const articulos = [...activos, ...inactivos];

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
  });

  const deleteMutation = useMutation({
    mutationFn: deleteArticulo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articulos'] });
      queryClient.invalidateQueries({ queryKey: ['articulos-inactivos'] });
    },
  });

  const openModal = (articulo?: Articulo) => {
    if (articulo) {
      setEditingArticulo(articulo);
      setFormData({
        codigo: articulo.codigo,
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
      updateMutation.mutate({ id: editingArticulo.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este artículo?')) {
      deleteMutation.mutate(id);
    }
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {articulos.map((articulo) => (
              <tr key={articulo.id} className={`hover:bg-gray-50 ${articulo.activo === false ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{articulo.codigo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{articulo.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{articulo.marca || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{articulo.descripcion || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${articulo.activo !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {articulo.activo !== false ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModal(articulo)} className="text-indigo-600 hover:text-indigo-900 mr-4" title="Editar">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => articulo.id && handleDelete(articulo.id)} className="text-red-600 hover:text-red-900" title="Eliminar">
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {articulos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No hay artículos registrados.</td>
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
                  <label htmlFor="articulo-codigo" className="block text-sm font-medium text-gray-700">Código</label>
                  <input
                    id="articulo-codigo"
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="articulo-nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    id="articulo-nombre"
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="articulo-marca" className="block text-sm font-medium text-gray-700">Marca</label>
                  <input
                    id="articulo-marca"
                    type="text"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="articulo-descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    id="articulo-descripcion"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
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
