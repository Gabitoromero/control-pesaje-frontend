import type { HistorialKpis as HistorialKpisData } from '../../../api/historial';

const formatPct = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1)}%`;

interface HistorialKpisProps {
  kpis: HistorialKpisData | undefined;
}

/** % of OK and out-of-range muestras over the whole filtered set. */
export function HistorialKpis({ kpis }: HistorialKpisProps) {
  const cargando = !kpis;
  const sinDatos = !!kpis && kpis.total === 0;
  const pct = (value: number | undefined) => (cargando ? '—' : sinDatos ? 'Sin datos' : formatPct(value ?? 0));

  return (
    <section aria-label="Indicadores" className="grid grid-cols-2 gap-4">
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm text-muted-foreground">Muestras OK</p>
        <p data-testid="kpi-ok-pct" className="text-3xl font-bold text-success">
          {pct(kpis?.porcentajeOk)}
        </p>
        <p data-testid="kpi-ok-count" className="text-xs text-muted-foreground">
          {kpis ? `${kpis.ok} de ${kpis.total}` : '—'}
        </p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm text-muted-foreground">Fuera de rango</p>
        <p data-testid="kpi-fuera-pct" className="text-3xl font-bold text-destructive">
          {pct(kpis?.porcentajeFueraRango)}
        </p>
        <p data-testid="kpi-fuera-count" className="text-xs text-muted-foreground">
          {kpis ? `${kpis.fueraRango} de ${kpis.total}` : '—'}
        </p>
      </div>
    </section>
  );
}
