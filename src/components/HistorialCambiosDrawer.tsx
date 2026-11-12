import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getHistorialCambios,
  type HistorialAccion,
  type HistorialCambioItem,
  type HistorialRaizTipo,
} from '../api/historial-cambios';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './ui/sheet';

const PAGE_SIZE = 20;

const ACCION_LABEL: Record<HistorialAccion, string> = {
  crear: 'Creación',
  editar: 'Edición',
  desactivar: 'Desactivación',
  eliminar: 'Eliminación',
};

const ENTIDAD_LABEL: Record<string, string> = {
  articulo: 'Artículo',
  etapa: 'Etapa',
  linea: 'Línea',
  ruta: 'Ruta',
  ruta_etapa: 'Etapa de la ruta',
  ruta_articulo: 'Artículo asignado',
};

const formatFecha = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} ${time}`;
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const ChangeDetail = ({ item }: { item: HistorialCambioItem }) => {
  const keys = Array.from(new Set([...Object.keys(item.antes), ...Object.keys(item.despues)]));
  if (keys.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1 text-sm">
      {keys.map((key) => (
        <li key={key} className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium text-foreground">{key}:</span>
          {item.accion === 'crear' ? (
            <span className="text-foreground">{formatValue(item.despues[key])}</span>
          ) : item.accion === 'eliminar' ? (
            <span className="text-muted-foreground line-through">{formatValue(item.antes[key])}</span>
          ) : (
            <>
              <span className="text-muted-foreground line-through">{formatValue(item.antes[key])}</span>
              <span aria-hidden>→</span>
              <span className="text-foreground">{formatValue(item.despues[key])}</span>
            </>
          )}
        </li>
      ))}
    </ul>
  );
};

interface Props {
  raizTipo: HistorialRaizTipo;
  raizId: number | null;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Reusable change-history drawer for a root record (articulo, ruta, etapa, linea). */
export const HistorialCambiosDrawer = ({ raizTipo, raizId, title, open, onOpenChange }: Props) => {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['historial-cambios', raizTipo, raizId, page],
    queryFn: () => getHistorialCambios({ raizTipo, raizId: raizId as number, page, pageSize: PAGE_SIZE }),
    enabled: open && raizId !== null,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setPage(1);
        onOpenChange(next);
      }}
    >
      <SheetContent className="overflow-y-auto">
        <SheetTitle className="text-lg font-semibold">Historial de cambios</SheetTitle>
        <SheetDescription className="text-sm text-muted-foreground">{title}</SheetDescription>

        {isLoading && <p className="text-sm text-muted-foreground">Cargando historial…</p>}
        {isError && <p className="text-sm text-destructive">No se pudo cargar el historial.</p>}
        {data && data.items.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay cambios registrados.</p>}

        <ol className="space-y-4">
          {data?.items.map((item) => (
            <li key={item.id} className="rounded-md border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-foreground">
                  {ACCION_LABEL[item.accion]} · {ENTIDAD_LABEL[item.entidad] ?? item.entidad}
                </span>
                <span className="text-muted-foreground">{formatFecha(item.fecha)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {item.usuario ? `${item.usuario.nombreApellido} (${item.usuario.nombreUsuario})` : 'Sistema'}
              </p>
              <ChangeDetail item={item} />
            </li>
          ))}
        </ol>

        {data && data.total > data.pageSize && (
          <div className="mt-auto flex items-center justify-between pt-2 text-sm">
            <button
              type="button"
              className="rounded border border-border px-3 py-1 disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            <span className="text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              className="rounded border border-border px-3 py-1 disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
