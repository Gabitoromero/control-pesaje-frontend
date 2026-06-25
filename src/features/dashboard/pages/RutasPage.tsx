import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  getRutas,
  getRutasInactivas,
  updateRuta,
} from '../../../api/rutas';
import type { Ruta, RutaUpdate } from '../../../shared/types/domain';
import { Plus, Edit } from 'lucide-react';
import { isAxiosError } from 'axios';
import { SearchToolbar, type SearchField } from '../../../components/SearchToolbar';


const RUTA_FIELDS: SearchField[] = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'descripcion', label: 'Descripción' },
];

export const RutasPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RutaUpdate }) =>
      updateRuta(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutas'] });
      queryClient.invalidateQueries({ queryKey: ['rutas-inactivos'] });
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



  if (isLoading) return <div className="p-6">Cargando rutas...</div>;
  if (error) return <div className="p-6 text-red-500">Error al cargar rutas</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Rutas</h1>
        <button
          onClick={() => navigate('/dashboard/rutas/new')}
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

                  <button onClick={() => navigate(`/dashboard/rutas/${ruta.id}`)} className="text-indigo-600 hover:text-indigo-900 mr-3" title="Editar">
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
    </div>
  );
};
