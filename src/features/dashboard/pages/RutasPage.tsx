import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  getRutas,
  getRutasInactivas,
} from '../../../api/rutas';
import type { Ruta } from '../../../shared/types/domain';
import { Plus, Edit } from 'lucide-react';
import { SearchToolbar, type SearchField } from '../../../components/SearchToolbar';


const RUTA_FIELDS: SearchField[] = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'descripcion', label: 'Descripción' },
];

export const RutasPage = () => {
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

  if (isLoading) return <div className="p-6 text-foreground">Cargando rutas...</div>;
  if (error) return <div className="p-6 text-destructive">Error al cargar rutas</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gestión de Rutas</h1>
        <button
          onClick={() => navigate('/dashboard/rutas/new')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2"
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

      <div className="bg-card border border-border rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {rutasFiltradas.map((ruta) => (
              <tr key={ruta.id} className={`hover:bg-accent even:bg-muted/40 ${ruta.activo === false ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{ruta.nombre}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{ruta.descripcion || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ruta.activo !== false ? 'bg-success-muted text-success' : 'bg-muted text-muted-foreground'}`}>
                    {ruta.activo !== false ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">

                  <button onClick={() => navigate(`/dashboard/rutas/${ruta.id}`)} className="text-muted-foreground hover:text-foreground mr-3" title="Editar">
                    <Edit size={18} />
                  </button>

                </td>
              </tr>
            ))}
            {rutasFiltradas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">No hay rutas {status === 'activo' ? 'activas' : 'inactivas'}.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
