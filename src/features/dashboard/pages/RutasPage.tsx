import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRutas,
  getRutasInactivas,
  createRuta,
  updateRuta,
  deleteRuta,
  type Ruta,
  type RutaCreate,
} from '../../../api/rutas';
import { Plus, Edit, Trash, X } from 'lucide-react';
import { isAxiosError } from 'axios';
import { SearchToolbar, type SearchField } from '../../../components/SearchToolbar';

const EMPTY_FORM = { nombre: '', descripcion: '' };

const RUTA_FIELDS: SearchField[] = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'descripcion', label: 'Descripción' },
];

export const RutasPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuta, setEditingRuta] = useState<Ruta | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [status, setStatus] = useState<'activo' | 'inactivo'>('activo');
  const [field, setField] = useState('nombre');
  const [query, setQuery] = useState('');

  const { data: activas = [], isLoading: loadingActivas, error: errorActivas } = useQuery({
    queryKey: ['rutas'],
    queryFn: getRutas,
  });

  const { data: inactivas = [], isLoading: loadingInactivas, error: errorInactivas } = useQuery({
    queryKey: ['rutas-inactivos'],
    queryFn: getRutasInactivas,
  });

  const isLoading = loadingActivas || loadingInactivas;
  const error = errorActivas || errorInactivas;

  const rutasFiltradas = useMemo(() => {
    const base = status === 'activo' ? activas : inactivas;
    const q = query.trim().toLowerCase();

    let result = base;
    if (q) {
      result = base.filter((r) =>
        String(r[field as keyof Ruta] ?? '').toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [activas, inactivas, status, field, query]);

  const createMutation = useMutation({
    mutationFn: createRuta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutas'] });
      queryClient.invalidateQueries({ queryKey: ['rutas-inactivos'] });
      closeModal();
    },
    onError: (err: unknown) => {
      let msg = 'Ocurrió un error inesperado';
      if (isAxiosError(err)) {
        msg = err.response?.data?.error?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`No se pudo crear la ruta:\n${msg}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RutaCreate> & { activo?: boolean } }) =>
      updateRuta(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutas'] });
      queryClient.invalidateQueries({ queryKey: ['rutas-inactivos'] });
      closeModal();
    },
    onError: (err: unknown) => {
      let msg = 'Ocurrió un error inesperado';
      if (isAxiosError(err)) {
        msg = err.response?.data?.error?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`No se pudo guardar la ruta:\n${msg}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRuta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutas'] });
      queryClient.invalidateQueries({ queryKey: ['rutas-inactivos'] });
      closeModal();
    },
    onError: (err: unknown) => {
      let msg = 'Ocurrió un error inesperado';
      if (isAxiosError(err)) {
        msg = err.response?.data?.error?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`No se pudo eliminar la ruta:\n${msg}\n\nNota de sistema: No podés eliminar entidades que ya están asociadas a Líneas en el sistema.`);
    },
  });

  const openModal = (ruta?: Ruta) => {
    if (ruta) {
      setEditingRuta(ruta);
      setFormData({ nombre: ruta.nombre, descripcion: ruta.descripcion || '' });
    } else {
      setEditingRuta(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRuta(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingRuta?.id) {
      updateMutation.mutate({
        id: editingRuta.id,
        data: { nombre: formData.nombre, descripcion: formData.descripcion.trim() || null },
      });
    } else {
      createMutation.mutate({ nombre: formData.nombre, descripcion: formData.descripcion || undefined, activo: true });
    }
  };

  const handleDelete = () => {
    if (editingRuta?.id && window.confirm('¿Está seguro de eliminar esta ruta?')) {
      deleteMutation.mutate(editingRuta.id);
    }
  };

  const handleActivar = () => {
    if (!editingRuta?.id) return;
    updateMutation.mutate({
      id: editingRuta.id,
      data: {
        nombre: formData.nombre,
        descripcion: formData.descripcion.trim() || null,
        activo: true,
      },
    });
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <div className="p-6">Cargando rutas...</div>;
  if (error) return <div className="p-6 text-red-500">Error al cargar rutas</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Rutas</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus size={18} /> Nueva Ruta
        </button>
      </div>

      <SearchToolbar
        status={status}
        onStatusChange={setStatus}
        fields={RUTA_FIELDS}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rutasFiltradas.map((ruta) => (
              <tr key={ruta.id} className={`hover:bg-gray-50 ${ruta.activo === false ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ruta.nombre}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{ruta.descripcion || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ruta.activo !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {ruta.activo !== false ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModal(ruta)} className="text-indigo-600 hover:text-indigo-900" title="Editar">
                    <Edit size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {rutasFiltradas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No hay rutas registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">{editingRuta ? 'Editar Ruta' : 'Nueva Ruta'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="ruta-nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    id="ruta-nombre"
                    type="text"
                    required
                    placeholder="Ej: Ruta de producción A"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="ruta-descripcion" className="block text-sm font-medium text-gray-700">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <textarea
                    id="ruta-descripcion"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
                    rows={3}
                    minLength={4}
                    placeholder="Ej: Ruta para productos de alta rotación"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                {editingRuta?.activo === false && (
                  <button type="button" disabled={isBusy} onClick={handleActivar}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 mr-auto">
                    Activar Ruta
                  </button>
                )}
                {editingRuta?.id && editingRuta?.activo !== false && (
                  <button type="button" disabled={isBusy || deleteMutation.isPending} onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 mr-auto flex items-center gap-2">
                    <Trash size={18} /> {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar Ruta'}
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
