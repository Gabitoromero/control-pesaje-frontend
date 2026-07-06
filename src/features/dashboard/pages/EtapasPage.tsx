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
import { Plus, Edit, Trash, X } from 'lucide-react';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { SearchToolbar, type SearchField } from '../../../components/SearchToolbar';

const EMPTY_FORM = { nombre: '', descripcion: '' };

const ETAPA_FIELDS: SearchField[] = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'descripcion', label: 'Descripción' },
];

export const EtapasPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<Etapa | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [status, setStatus] = useState<'activo' | 'inactivo'>('activo');
  const [field, setField] = useState('nombre');
  const [query, setQuery] = useState('');

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
      let msg = 'Ocurrió un error inesperado';
      if (isAxiosError(err)) {
        msg = err.response?.data?.error?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`No se pudo guardar la etapa:\n${msg}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEtapa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapas'] });
      queryClient.invalidateQueries({ queryKey: ['etapas-inactivas'] });
      closeModal();
    },
    onError: (err: unknown) => {
      let msg = 'Ocurrió un error inesperado';
      if (isAxiosError(err)) {
        msg = err.response?.data?.error?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`No se pudo eliminar la etapa:\n${msg}\n\nNota de sistema: No podés eliminar entidades que ya están asociadas a Rutas en el sistema.`);
    }
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

  const handleDelete = () => {
    if (editingEtapa?.id && window.confirm('¿Está seguro de eliminar esta etapa?')) {
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

  if (isLoading) return <div className="p-6">Cargando etapas...</div>;
  if (error) return <div className="p-6 text-red-500">Error al cargar etapas</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Etapas</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
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
            {etapasFiltradas.map((etapa) => (
              <tr key={etapa.id} className={`hover:bg-gray-50 ${etapa.activo === false ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{etapa.nombre}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{etapa.descripcion || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${etapa.activo !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {etapa.activo !== false ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModal(etapa)} className="text-indigo-600 hover:text-indigo-900" title="Editar">
                    <Edit size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {etapasFiltradas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No hay etapas {status === 'activo' ? 'activas' : 'inactivas'}.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">{editingEtapa ? 'Editar Etapa' : 'Nueva Etapa'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="etapa-nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    id="etapa-nombre"
                    type="text"
                    required
                    placeholder="Ej: Amasado"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="etapa-descripcion" className="block text-sm font-medium text-gray-700">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <textarea
                    id="etapa-descripcion"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
                    rows={3}
                    minLength={4}
                    placeholder="Ej: Proceso de preparación inicial de la masa"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                {editingEtapa?.activo === false && (
                  <button type="button" disabled={isBusy} onClick={handleActivar}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 mr-auto">
                    Activar Etapa
                  </button>
                )}
                {editingEtapa?.id && editingEtapa?.activo !== false && (
                  <button type="button" disabled={isBusy || deleteMutation.isPending} onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 mr-auto flex items-center gap-2">
                    <Trash size={18} /> {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar Etapa'}
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

