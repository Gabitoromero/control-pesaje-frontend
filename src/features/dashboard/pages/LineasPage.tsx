import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLineas, createLinea, updateLinea, deleteLinea, type Linea, type LineaCreate } from '../../../api/lineas';
import { getRutas } from '../../../api/rutas';
import { Plus, Edit, Trash, X } from 'lucide-react';

export const LineasPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLinea, setEditingLinea] = useState<Linea | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    numeroBalanza: 1,
    rutaPasadaActivaId: '',
  });

  const { data: lineas, isLoading, error } = useQuery({
    queryKey: ['lineas'],
    queryFn: getLineas,
  });

  const { data: rutas } = useQuery({
    queryKey: ['rutas'],
    queryFn: getRutas,
  });

  const createMutation = useMutation({
    mutationFn: createLinea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<LineaCreate> }) => updateLinea(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLinea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
    },
  });

  const openModal = (linea?: Linea) => {
    if (linea) {
      setEditingLinea(linea);
      setFormData({
        nombre: linea.nombre,
        numeroBalanza: linea.numeroBalanza,
        rutaPasadaActivaId: linea.rutaPasadaActivaId?.toString() || '',
      });
    } else {
      setEditingLinea(null);
      setFormData({ nombre: '', numeroBalanza: 1, rutaPasadaActivaId: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLinea(null);
    setFormData({ nombre: '', numeroBalanza: 1, rutaPasadaActivaId: '' });
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const payload: LineaCreate = {
      nombre: formData.nombre,
      numeroBalanza: Number(formData.numeroBalanza),
    };
    
    if (formData.rutaPasadaActivaId) {
      payload.rutaPasadaActivaId = Number(formData.rutaPasadaActivaId);
    }

    if (editingLinea?.id) {
      updateMutation.mutate({ id: editingLinea.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta línea?')) {
      deleteMutation.mutate(id);
    }
  };

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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balanza N°</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruta Activa</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lineas?.map((linea) => (
              <tr key={linea.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{linea.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{linea.numeroBalanza}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{linea.rutaPasadaActiva?.nombre ?? '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openModal(linea)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => linea.id && handleDelete(linea.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Eliminar"
                  >
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {lineas?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No hay líneas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingLinea ? 'Editar Línea' : 'Nueva Línea'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="linea-nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    id="linea-nombre"
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <div>
                  <label htmlFor="linea-ruta" className="block text-sm font-medium text-gray-700">Ruta Activa</label>
                  <select
                    id="linea-ruta"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.rutaPasadaActivaId}
                    onChange={(e) => setFormData({ ...formData, rutaPasadaActivaId: e.target.value })}
                  >
                    <option value="">-- Sin ruta --</option>
                    {rutas?.map((ruta) => (
                      <option key={ruta.id} value={ruta.id}>
                        {ruta.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
