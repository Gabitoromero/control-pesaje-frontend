import { useEffect, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { getHistorial } from '../../../api/historial';
import { getEtapas } from '../../../api/etapas';
import { getArticulos } from '../../../api/articulos';
import { PESO_DECIMALS } from '../../../shared/constants';
import { getAvatarInitials } from '../utils/avatarInitials';
import { HistorialKpis } from '../components/HistorialKpis';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const fieldClass =
  'rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring';

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

export function HistorialPage() {
  const { user } = useAuth();
  const [etapaId, setEtapaId] = useState('');
  const [articuloId, setArticuloId] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  // Debounce the search box; a changed search goes back to the first page.
  // Skipped while the term equals the applied one, so the timer armed on mount doesn't reset the page.
  useEffect(() => {
    const term = busqueda.trim();
    if (term === q) return;
    const id = setTimeout(() => {
      setQ(term);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [busqueda, q]);

  const { data: etapas = [] } = useQuery({ queryKey: ['etapas'], queryFn: getEtapas });
  const { data: articulos = [] } = useQuery({ queryKey: ['articulos'], queryFn: getArticulos });

  const params = {
    etapaId: etapaId ? Number(etapaId) : undefined,
    articuloId: articuloId ? Number(articuloId) : undefined,
    desde: desde || undefined,
    hasta: hasta || undefined,
    q: q || undefined,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['historial', params],
    queryFn: () => getHistorial(params),
    placeholderData: keepPreviousData,
  });

  const onFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div data-testid="tablet-page-root" className="h-screen bg-background flex flex-col font-sans text-foreground overflow-hidden">
      <header className="bg-card border-b border-border p-4 md:px-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Mi historial</h1>
          <p className="text-muted-foreground text-sm">Tus muestras anteriores</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm">
            {getAvatarInitials(user?.nombreUsuario)}
          </div>
          <span className="hidden sm:block text-sm font-medium">{user?.nombreUsuario}</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 overflow-y-auto space-y-6">
        <HistorialKpis kpis={data?.kpis} />

        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <select
            aria-label="Etapa"
            className={fieldClass}
            value={etapaId}
            onChange={e => onFilterChange(setEtapaId)(e.target.value)}
          >
            <option value="">Todas las etapas</option>
            {etapas.map(et => (
              <option key={et.id} value={et.id}>
                {et.nombre}
              </option>
            ))}
          </select>
          <select
            aria-label="Artículo"
            className={fieldClass}
            value={articuloId}
            onChange={e => onFilterChange(setArticuloId)(e.target.value)}
          >
            <option value="">Todos los artículos</option>
            {articulos.map(a => (
              <option key={a.id} value={a.id}>
                {a.codigo}
                {a.nombre ? ` — ${a.nombre}` : ''}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Desde
            <input
              type="date"
              aria-label="Desde"
              className={fieldClass}
              value={desde}
              max={hasta || undefined}
              onChange={e => onFilterChange(setDesde)(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Hasta
            <input
              type="date"
              aria-label="Hasta"
              className={fieldClass}
              value={hasta}
              min={desde || undefined}
              onChange={e => onFilterChange(setHasta)(e.target.value)}
            />
          </label>
          <input
            type="search"
            aria-label="Buscar"
            placeholder="Buscar por artículo, etapa, ruta u observación..."
            className={`${fieldClass} flex-1 min-w-[14rem]`}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        {isLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        )}
        {isError && <p role="alert" className="text-destructive text-sm">No se pudo cargar el historial.</p>}

        {data && data.items.length === 0 && (
          <p className="text-center text-muted-foreground py-10">No hay muestras para los filtros elegidos.</p>
        )}

        {data && data.items.length > 0 && (
          <ul className="space-y-2" aria-label="Listado de muestras">
            {data.items.map(m => (
              <li
                key={m.id}
                className="bg-card border border-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {m.articulo ? `${m.articulo.codigo}${m.articulo.nombre ? ` — ${m.articulo.nombre}` : ''}` : 'Muestra libre'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {m.etapa.nombre} · {m.rutaPasada.nombre} · {formatFecha(m.timestamp)}
                  </span>
                  {m.observacion && <span className="text-xs text-muted-foreground italic">{m.observacion}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{m.pesoNeto.toFixed(PESO_DECIMALS)} kg</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                      m.estadoValidacion === 'ok' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {m.estadoValidacion === 'ok' ? 'OK' : 'Fuera de rango'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {data && data.total > 0 && (
          <nav aria-label="Paginación" className="flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Página anterior"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-lg bg-muted/50 hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              aria-label="Página siguiente"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-lg bg-muted/50 hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}
