import type { EstadoReporte } from '../hooks/useReporteSinPeso';

export interface ReporteSinPesoButtonProps {
  estado: EstadoReporte;
  segundosRestantes: number;
  deshabilitado: boolean;
  /** Why the button is disabled; shown under it. */
  motivoDeshabilitado?: string;
  onClick: () => void;
  /** Accent color: 'primary' (cyan) for TabletWorkspace, 'warning' (amber) for Muestras Libres. */
  variant: 'primary' | 'warning';
  /** Extra classes for the root, e.g. absolute positioning by the page. */
  className?: string;
}

function labelFor(estado: EstadoReporte, segundosRestantes: number): string {
  if (estado === 'enviando') return 'Enviando…';
  if (estado === 'enfriamiento') return `Reportar de nuevo en ${segundosRestantes} s`;
  return 'No veo el peso';
}

/** Presentational: all state comes from `useReporteSinPeso`. */
export function ReporteSinPesoButton({
  estado,
  segundosRestantes,
  deshabilitado,
  motivoDeshabilitado,
  onClick,
  variant,
  className = '',
}: ReporteSinPesoButtonProps) {
  const accent = variant === 'warning' ? 'border-warning text-warning' : 'border-primary text-primary';

  return (
    <div className={`flex flex-col items-end gap-1 ${className}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={deshabilitado}
        aria-label={estado === 'idle' ? 'No veo el peso: enviar reporte' : undefined}
        title="Envía un reporte de diagnóstico a soporte"
        className={`min-h-11 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${accent} ${
          deshabilitado ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
        }`}
      >
        <span aria-hidden="true">⚠️ </span>
        {labelFor(estado, segundosRestantes)}
      </button>
      <p role="status" aria-live="polite" className="max-w-48 text-right text-xs text-muted-foreground">
        {motivoDeshabilitado}
      </p>
    </div>
  );
}
