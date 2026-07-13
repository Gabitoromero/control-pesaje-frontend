import type { DashboardKpi } from '../../../api/dashboard';

interface MonitoreoKpiStripProps {
  kpis: DashboardKpi;
}

function KpiCard({ label, value, color = 'text-foreground' }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl px-5 py-3 flex flex-col justify-center min-w-[140px] flex-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-2xl font-bold ${color} font-mono tabular-nums`}>{value}</span>
    </div>
  );
}

export function MonitoreoKpiStrip({ kpis }: MonitoreoKpiStripProps) {
  return (
    <div className="flex gap-3">
      <KpiCard label="Muestras totales" value={kpis.totalMuestras} />
      <KpiCard label="Fuera de rango" value={kpis.muestrasFueraDeRango} color="text-destructive" />
      <KpiCard label="Pasadas finalizadas" value={kpis.pasadasFinalizadas} />
      <KpiCard label="Pasadas en curso" value={kpis.pasadasEnCurso} />
    </div>
  );
}
