import type { DashboardKpi } from '../../../api/dashboard';

interface MonitoreoKpiStripProps {
  kpis: DashboardKpi;
}

export function MonitoreoKpiStrip({ kpis }: MonitoreoKpiStripProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-card border border-border rounded-xl px-5 py-3 flex flex-col justify-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Muestras totales</span>
        <span className="text-2xl font-bold text-foreground font-mono tabular-nums">{kpis.muestrasTotales}</span>
      </div>
      <div className="bg-card border border-border rounded-xl px-5 py-3 flex flex-col justify-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fuera de rango</span>
        <span className="text-2xl font-bold text-destructive font-mono tabular-nums">{kpis.fueraRango}</span>
      </div>
      <div className="bg-card border border-border rounded-xl px-5 py-3 flex flex-col justify-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pasadas finalizadas</span>
        <span className="text-2xl font-bold text-foreground font-mono tabular-nums">{kpis.pasadasFinalizadas}</span>
      </div>
      <div className="bg-card border border-border rounded-xl px-5 py-3 flex flex-col justify-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pasadas en curso</span>
        <span className="text-2xl font-bold text-foreground font-mono tabular-nums">{kpis.pasadasEnCurso}</span>
      </div>
    </div>
  );
}
