import { useState } from 'react';
import { Bot, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  getHistorialCambios,
  type HistorialAccion,
  type HistorialCambioItem,
  type HistorialReferencias,
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

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

const UserBadge = ({ usuario }: { usuario: HistorialCambioItem['usuario'] }) => (
  <div className="mt-1.5 flex items-center gap-2">
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary"
      aria-hidden
    >
      {usuario ? initials(usuario.nombreApellido) || <User className="size-3.5" /> : <Bot className="size-3.5" />}
    </span>
    <span className="text-sm text-foreground">{usuario ? usuario.nombreApellido : 'Sistema'}</span>
    {usuario && <span className="text-xs text-muted-foreground">@{usuario.nombreUsuario}</span>}
  </div>
);

const formatFecha = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} ${time}`;
};

const FIELD_LABEL: Record<string, string> = {
  id: 'Id',
  codigo: 'Código',
  nombre: 'Nombre',
  descripcion: 'Descripción',
  activo: 'Activo',
  articulo: 'Artículo',
  etapa: 'Etapa',
  rutaPasada: 'Ruta',
  rutaPasadaActiva: 'Ruta activa',
  balanza: 'Balanza',
  orden: 'Orden',
  pesoIdeal: 'Peso ideal',
  pesoMinimo: 'Peso mínimo',
  pesoMaximo: 'Peso máximo',
  cantidadMuestrasRequeridas: 'Muestras requeridas',
  toleranciaPorDefecto: 'Tolerancia por defecto',
  toleranciaPct: 'Tolerancia (%)',
  magnitud: 'Magnitud',
  observacion: 'Observación',
};

const formatValue = (value: unknown, field?: string, referencias?: HistorialReferencias): string => {
  if (field && typeof value === 'number' && referencias?.[field]) {
    const label = referencias[field][String(value)];
    return label ? `${label} (#${value})` : `#${value} (ya no existe)`;
  }
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const ChangeDetail = ({ item, referencias }: { item: HistorialCambioItem; referencias?: HistorialReferencias }) => {
  const keys = Array.from(new Set([...Object.keys(item.antes), ...Object.keys(item.despues)]));
  if (keys.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1 text-sm">
      {keys.map((key) => (
        <li key={key} className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium text-foreground">{FIELD_LABEL[key] ?? key}:</span>
          {item.accion === 'crear' ? (
            <span className="text-foreground">{formatValue(item.despues[key], key, referencias)}</span>
          ) : item.accion === 'eliminar' ? (
            <span className="text-muted-foreground line-through">{formatValue(item.antes[key], key, referencias)}</span>
          ) : (
            <>
              <span className="text-muted-foreground line-through">{formatValue(item.antes[key], key, referencias)}</span>
              <span aria-hidden>→</span>
              <span className="text-foreground">{formatValue(item.despues[key], key, referencias)}</span>
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
              {item.contexto && <p className="mt-1 text-sm font-semibold text-foreground">{item.contexto}</p>}
              <UserBadge usuario={item.usuario} />
              <ChangeDetail item={item} referencias={data.referencias} />
            </li>
          ))}
        </ol>

        {data && data.total > 0 && (
          <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-sm">
            <span className="text-muted-foreground">
              {data.total} {data.total === 1 ? 'cambio' : 'cambios'}
              {totalPages > 1 && ` · Página ${page} de ${totalPages}`}
            </span>
            {totalPages > 1 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border border-border px-3 py-1 disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </button>
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
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
