import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getRutas,
  getRutasInactivas,
} from '../../../api/rutas';
import type { Ruta } from '../../../shared/types/domain';
import { Plus, Edit, History, Eye } from 'lucide-react';
import { HistorialCambiosDrawer } from '../../../components/HistorialCambiosDrawer';
import { EntityDetailDrawer } from '../../../components/EntityDetailDrawer';
import { SearchToolbar, type SearchField } from '../../../components/SearchToolbar';
import { PaginationBar } from '../../../components/PaginationBar';
import { usePagedCatalog } from '../../../hooks/usePagedCatalog';
import { useActividadGlobal } from '../hooks/useActividadGlobal';


const RUTA_FIELDS: SearchField[] = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'descripcion', label: 'Descripción' },
];

export const RutasPage = () => {
  const navigate = useNavigate();

  const [detalle, setDetalle] = useState<Ruta | null>(null);
  const [historial, setHistorial] = useState<{ id?: number; title: string } | null>(null);

  const { hayActividad } = useActividadGlobal();

  const {
    status,
    setStatus,
    field,
    setField,
    query,
    setQuery,
    page,
    setPage,
    pageSize,
    items: rutasFiltradas,
    total,
    isLoading,
    isFetching,
    error,
  } = usePagedCatalog<Ruta>({
    key: 'rutas',
    fetchActive: getRutas,
    fetchInactive: getRutasInactivas,
    defaultField: 'nombre',
    sortBy: 'nombre',
  });

  if (isLoading) return <div className="p-6 text-foreground">Cargando rutas...</div>;
  if (error) return <div className="p-6 text-destructive">Error al cargar rutas</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gestión de Rutas</h1>
        <button
          onClick={() => navigate('/dashboard/rutas/new')}
          disabled={hayActividad}
          title={hayActividad ? 'No se pueden crear rutas mientras haya pasadas o sesiones activas' : ''}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {hayActividad && (
        <div className="mb-6 p-4 bg-warning/20 border border-warning/50 rounded-md text-foreground">
          <p className="font-semibold flex items-center gap-2">
            ⚠️ Bloqueo de seguridad activo
          </p>
          <p className="text-sm mt-1">
            No se permite crear o editar rutas mientras haya pasadas o sesiones activas en el sistema.
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Descripción</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {rutasFiltradas.map((ruta) => (
                <tr key={ruta.id} className={`hover:bg-accent even:bg-muted/40 ${ruta.activo === false ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-4 whitespace-nowrap max-w-[18rem] truncate text-sm font-medium text-foreground" title={ruta.nombre}>{ruta.nombre}</td>
                  <td className="px-4 py-4 max-w-[14rem] truncate text-sm text-muted-foreground" title={ruta.descripcion || undefined}>{ruta.descripcion || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ruta.activo !== false ? 'bg-success-muted text-success' : 'bg-muted text-muted-foreground'}`}>
                      {ruta.activo !== false ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">

                    <button
                      type="button"
                      onClick={() => setDetalle(ruta)}
                      className="text-muted-foreground hover:text-foreground mr-5"
                      title="Ver detalle"
                      aria-label="Ver detalle"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistorial({ id: ruta.id, title: ruta.nombre })}
                      className="text-muted-foreground hover:text-foreground mr-5"
                      title="Ver historial de cambios"
                      aria-label="Ver historial de cambios"
                    >
                      <History size={18} />
                    </button>
                    <button 
                      onClick={() => navigate(`/dashboard/rutas/${ruta.id}`)} 
                      disabled={hayActividad}
                      className="text-muted-foreground hover:text-foreground mr-5 disabled:opacity-50 disabled:cursor-not-allowed" 
                      title={hayActividad ? 'Bloqueado por actividad en el sistema' : 'Editar'}
                    >
                      <Edit size={18} />
                    </button>

                  </td>
                </tr>
              ))}
              {rutasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">No hay rutas {status === 'activo' ? 'activas' : 'inactivas'}.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} disabled={isFetching} />

      <EntityDetailDrawer
        open={detalle !== null}
        onOpenChange={(open) => { if (!open) setDetalle(null); }}
        title="Detalle de la ruta"
        fields={[
          { label: 'Nombre', value: detalle?.nombre },
          { label: 'Descripción', value: detalle?.descripcion },
          { label: 'Estado', value: detalle?.activo !== false ? 'Activa' : 'Inactiva' },
        ]}
        onViewHistorial={() => {
          if (!detalle) return;
          setHistorial({ id: detalle.id, title: detalle.nombre });
          setDetalle(null);
        }}
      />
      <HistorialCambiosDrawer
        raizTipo="ruta"
        raizId={historial?.id ?? null}
        title={historial?.title ?? ''}
        open={historial !== null}
        onOpenChange={(open) => { if (!open) setHistorial(null); }}
      />
    </div>
  );
};
