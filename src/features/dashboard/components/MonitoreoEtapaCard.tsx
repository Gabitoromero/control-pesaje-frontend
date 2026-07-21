import type { DashboardEtapa } from '../../../api/dashboard';

interface MonitoreoEtapaCardProps {
  etapa: DashboardEtapa;
  rutaAsignadaAt: string | null;
}

export function MonitoreoEtapaCard({ etapa, rutaAsignadaAt }: MonitoreoEtapaCardProps) {
  const isUltimoOk = etapa.ultimoPeso >= etapa.pesoMinimo && etapa.ultimoPeso <= etapa.pesoMaximo;
  const estadoColor = isUltimoOk ? 'text-success' : 'text-destructive';

  // Use estadoValidacion from backend — single source of truth, no re-calculation.
  const muestrasOk = etapa.timeSeries.filter(m => m.estadoValidacion === 'ok').length;
  const muestrasFuera = etapa.timeSeries.length - muestrasOk;

  const x1 = (() => {
    if (rutaAsignadaAt) {
      return new Date(rutaAsignadaAt).getTime();
    }
    if (etapa.timeSeries.length > 0) {
      return new Date(etapa.timeSeries[0].time).getTime();
    }
    return Date.now() - 3600000;
  })();

  const x2 = (() => {
    const now = Date.now();
    return now > x1 + 1000 ? now : x1 + 1001;
  })();

  return (
    <div className="w-full flex flex-col flex-1 min-h-0 h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ETAPA</p>
          <h3 className="text-lg font-bold text-foreground">{etapa.etapa.nombre}</h3>
          <p className="text-[11px] text-muted-foreground font-mono">
            rango {etapa.pesoMinimo}–{etapa.pesoMaximo} g · ideal {etapa.pesoIdeal} g
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ÚLTIMO PESO</p>
          <p className={`text-2xl font-bold font-mono ${estadoColor}`}>
            {etapa.ultimoPeso?.toFixed(1) ?? '—'}
            <span className="text-sm font-normal text-muted-foreground"> g</span>
          </p>
          <p className={`text-xs font-semibold font-mono ${estadoColor}`}>
            {etapa.porcentajeConforme.toFixed(1)}% conforme
          </p>
        </div>
      </div>

      {/* Scatter chart area */}
      <div className="relative flex-1 min-h-[200px] bg-accent/30 rounded-sm mb-4 border border-border overflow-hidden">
        {/* Tolerance band */}
        <div className="absolute left-0 right-12 bg-success/10" style={{ top: '25%', bottom: '25%' }} />

        {/* Max line */}
        <div className="absolute left-0 right-12 h-px bg-warning/60" style={{ top: '25%' }} />
        <span className="absolute right-1 text-[9px] font-semibold text-warning font-mono" style={{ top: '22%' }}>MÁX {etapa.pesoMaximo}</span>

        {/* Ideal line */}
        <div className="absolute left-0 right-12 h-px bg-primary" style={{ top: '50%' }} />
        <span className="absolute right-1 text-[9px] font-semibold text-primary font-mono" style={{ top: '47%' }}>IDEAL {etapa.pesoIdeal}</span>

        {/* Min line */}
        <div className="absolute left-0 right-12 h-px bg-warning/60" style={{ bottom: '25%' }} />
        <span className="absolute right-1 text-[9px] font-semibold text-warning font-mono" style={{ bottom: '22%' }}>MÍN {etapa.pesoMinimo}</span>

        {/* Data points */}
        <div className="absolute inset-0 right-12">
          {etapa.timeSeries.map((muestra, i) => {
            const t = new Date(muestra.time).getTime();
            const normX = Math.max(0, Math.min(100, ((t - x1) / (x2 - x1)) * 100));
            const range = etapa.pesoMaximo - etapa.pesoMinimo;
            const normY = range > 0 ? 75 - (((muestra.peso - etapa.pesoMinimo) / range) * 50) : 50;
            const isOk = muestra.estadoValidacion === 'ok';
            const isLibre = muestra.pasadaId === null;
            // Pasada samples: filled circle. Free samples: smaller, dimmed, diamond shape.
            const colorClass = isOk ? 'bg-success border-card' : 'bg-destructive border-card';
            const sizeClass = isLibre ? 'w-2.5 h-2.5 opacity-60 rotate-45' : 'w-3.5 h-3.5';
            const label = `${muestra.peso.toFixed(1)}g · ${isOk ? 'OK' : 'Fuera'}${isLibre ? ' · muestra libre' : ''}`;
            return (
              <div
                key={i}
                className={`absolute border-2 rounded-full ${colorClass} ${sizeClass}`}
                style={{ left: `${normX}%`, top: `${Math.max(2, Math.min(98, normY))}%`, transform: 'translate(-50%, -50%)' }}
                title={label}
              />
            );
          })}
        </div>
      </div>

      {/* Time axis */}
      <div className="flex justify-between mb-3 mr-12">
        <span className="text-[9px] text-muted-foreground font-mono tabular-nums">
          {new Date(x1).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="text-[9px] text-muted-foreground font-mono tabular-nums">
          {new Date(x2).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Footer stats */}
      <div className="flex justify-between items-center pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground font-mono">{etapa.timeSeries.length} muestras desde el inicio</span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono">
            <span className="text-success">● </span>
            <span className="text-muted-foreground">{muestrasOk} ok</span>
          </span>
          <span className="text-xs font-mono">
            <span className="text-destructive">● </span>
            <span className="text-muted-foreground">{muestrasFuera} fuera</span>
          </span>
        </div>
      </div>
    </div>
  );
}
