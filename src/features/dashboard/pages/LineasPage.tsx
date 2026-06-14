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
import { Plus, Edit, Trash, X } from 'lucide-react';
import { isAxiosError } from 'axios';
import { SearchToolbar, type SearchField } from '../../../components/SearchToolbar';

const EMPTY_FORM = { nombre: '', numeroBalanza: 1, rutaPasadaActiva: '' };

const LINEA_FIELDS: SearchField[] = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'numeroBalanza', label: 'N° Balanza' },
];

export const LineasPage = () => {
  const queryClient = useQueryClient();
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      queryClient.invalidateQueries({ queryKey: ['lineas-inactivos'] });
      closeModal();
    },
    onError: (err: unknown) => {
      let msg = 'Ocurrió un error inesperado';
      if (isAxiosError(err)) {
        msg = err.response?.data?.error?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`No se pudo crear la línea:\n${msg}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<LineaCreate> & { activo?: boolean } }) =>
      updateLinea(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      queryClient.invalidateQueries({ queryKey: ['lineas-inactivos'] });
      closeModal();
    },
    onError: (err: unknown) => {
      let msg = 'Ocurrió un error inesperado';
      if (isAxiosError(err)) {
        msg = err.response?.data?.error?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`No se pudo guardar la línea:\n${msg}`);
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
      let msg = 'Ocurrió un error inesperado';
      if (isAxiosError(err)) {
        msg = err.response?.data?.error?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`No se pudo eliminar la línea:\n${msg}`);
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

  const handleDelete = () => {
    if (editingLinea?.id && window.confirm('¿Está seguro de eliminar esta línea?')) {
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
    });
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <div className="p-6">Cargando líneas...</div>;
  if (error) return <div className="p-6 text-red-500">Error al cargar líneas</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Líneas</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
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

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Balanza</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruta Activa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lineasFiltradas.map((linea) => (
              <tr key={linea.id} className={`hover:bg-gray-50 ${linea.activo === false ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{linea.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{linea.numeroBalanza}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{linea.rutaPasadaActiva?.nombre ?? '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${linea.activo !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {linea.activo !== false ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModal(linea)} className="text-indigo-600 hover:text-indigo-900" title="Editar">
                    <Edit size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {lineasFiltradas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No hay líneas registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">{editingLinea ? 'Editar Línea' : 'Nueva Línea'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="linea-nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    id="linea-nombre"
                    type="text"
                    required
                    placeholder="Ej: Línea 1 — Envasado A"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="linea-balanza" className="block text-sm font-medium text-gray-700">Número de Balanza</label>
                  <input
                    id="linea-balanza"
                    type="number"
                    required
                    min="1"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.numeroBalanza}
                    onChange={(e) => setFormData({ ...formData, numeroBalanza: Number(e.target.value) })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="linea-ruta" className="block text-sm font-medium text-gray-700">Ruta Activa <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <select
                    id="linea-ruta"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              <div className="mt-6 flex justify-end gap-3">
                {editingLinea?.activo === false && (
                  <button type="button" disabled={isBusy} onClick={handleActivar}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 mr-auto">
                    Activar Línea
                  </button>
                )}
                {editingLinea?.id && editingLinea?.activo !== false && (
                  <button type="button" disabled={isBusy || deleteMutation.isPending} onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 mr-auto flex items-center gap-2">
                    <Trash size={18} /> {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar Línea'}
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
