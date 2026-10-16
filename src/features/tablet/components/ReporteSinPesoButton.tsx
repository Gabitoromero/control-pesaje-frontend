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
}

function labelFor(estado: EstadoReporte, segundosRestantes: number): string {
  if (estado === 'enviando') return 'Enviando…';
  if (estado === 'enfriamiento') return `Podrá reportar nuevamente en ${segundosRestantes} s`;
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
}: ReporteSinPesoButtonProps) {
  const accent = variant === 'warning' ? 'border-warning text-warning' : 'border-primary text-primary';

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={deshabilitado}
        className={`px-4 py-2 rounded-xl border-2 text-base font-semibold transition-all ${accent} ${
          deshabilitado ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
        }`}
      >
        {labelFor(estado, segundosRestantes)}
      </button>
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {motivoDeshabilitado}
      </p>
    </div>
  );
}
