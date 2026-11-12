import { useEffect, useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, MessageSquareText } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { getHistorial, type HistorialItem as HistorialItemData } from '../../../api/historial';
import { getEtapas } from '../../../api/etapas';
import { getArticulos } from '../../../api/articulos';
import { PESO_DECIMALS } from '../../../shared/constants';
import { unidadLabel } from '../../../shared/peso';
import { getLinea } from '../../../api/lineas';
import { SearchableCombobox } from '../../../components/ui/SearchableCombobox';
import { HistorialKpis } from '../components/HistorialKpis';
import { TabletPlantaHeader } from '../components/TabletPlantaHeader';
import { useTabletLogout } from '../hooks/useTabletLogout';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

// Same box metrics as SearchableCombobox (py-1.5, text-sm) so every filter control has the same height
const fieldClass =
  'w-full rounded-md border border-border bg-background text-foreground px-3 py-1.5 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring';

const naturalCompare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

function HistorialItem({ m }: { m: HistorialItemData }) {
  const [open, setOpen] = useState(false);
  const tieneObservacion = m.observacion !== null && m.observacion !== '';
  const ok = m.estadoValidacion === 'ok';

  const row = (
    <>
      <div className="flex flex-col">
        <span className="font-medium">
          {m.articulo ? `${m.articulo.codigo}${m.articulo.nombre ? ` — ${m.articulo.nombre}` : ''}` : 'Muestra libre'}
        </span>
        <span className="text-xs text-muted-foreground">
          {m.etapa.nombre} · {m.rutaPasada.nombre} · {formatFecha(m.timestamp)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {tieneObservacion && (
          <span className="flex items-center gap-0.5 text-muted-foreground">
            <MessageSquareText aria-hidden className="h-4 w-4" />
            <ChevronDown aria-hidden className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            <span className="sr-only">Tiene observación</span>
          </span>
        )}
        <span className="font-medium">{m.pesoNeto.toFixed(PESO_DECIMALS)} {unidadLabel('kg', m.magnitud)}</span>
        <span className="sr-only">{ok ? 'Estado: OK' : 'Estado: fuera de rango'}</span>
      </div>
    </>
  );
  const rowClass = 'p-3 flex flex-wrap items-center justify-between gap-3';

  return (
    <li
      data-estado={ok ? 'ok' : 'fuera_de_rango'}
      className={`border rounded-xl ${ok ? 'bg-success/10 border-success/40' : 'bg-destructive/10 border-destructive/40'}`}
    >
      {tieneObservacion ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          className={`${rowClass} w-full text-left rounded-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`}
        >
          {row}
        </button>
      ) : (
        <div className={rowClass}>{row}</div>
      )}
      {tieneObservacion && open && (
        <p className="px-3 pb-3 pt-2 text-sm text-muted-foreground border-t border-border whitespace-pre-wrap break-words">
          {m.observacion}
        </p>
      )}
    </li>
  );
}

export function HistorialPage() {
  const { activeLineaId } = useAuth();
  const handleLogout = useTabletLogout();
  const [etapaId, setEtapaId] = useState<number | null>(null);
  const [articuloId, setArticuloId] = useState<number | null>(null);
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
  const { data: linea } = useQuery({
    queryKey: ['linea', activeLineaId],
    queryFn: () => getLinea(activeLineaId!),
    enabled: !!activeLineaId,
  });

  const etapaOptions = useMemo(
    () => [...etapas].sort((a, b) => naturalCompare(a.nombre, b.nombre)).map(e => ({ id: e.id, nombre: e.nombre })),
    [etapas],
  );
  const articuloOptions = useMemo(
    () =>
      [...articulos]
        .sort((a, b) => naturalCompare(a.codigo, b.codigo))
        .map(a => ({ id: a.id, nombre: a.nombre ? `[${a.codigo}] ${a.nombre}` : a.codigo })),
    [articulos],
  );

  const params = {
    etapaId: etapaId ?? undefined,
    articuloId: articuloId ?? undefined,
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

  const onFilterChange = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div data-testid="tablet-page-root" className="h-screen bg-background flex flex-col font-sans text-foreground overflow-hidden">
      <TabletPlantaHeader lineaNombre={linea?.nombre ?? `Línea ${activeLineaId}`} onLogout={handleLogout} />

      <main className="flex-1 w-full p-4 md:p-8 overflow-y-auto space-y-6">
        <HistorialKpis kpis={data?.kpis} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            Etapa
            <SearchableCombobox
              value={etapaId}
              onChange={onFilterChange(setEtapaId)}
              options={etapaOptions}
              placeholder="Buscar etapa..."
              emptyLabel="Todas las etapas"
              clearable
            />
          </div>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            Artículo
            <SearchableCombobox
              value={articuloId}
              onChange={onFilterChange(setArticuloId)}
              options={articuloOptions}
              placeholder="Buscar artículo..."
              emptyLabel="Todos los artículos"
              clearable
            />
          </div>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
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
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
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
            className={`${fieldClass} sm:col-span-2 lg:col-span-4`}
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
              <HistorialItem key={m.id} m={m} />
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
