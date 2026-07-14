import type { DashboardEtapa } from '../../../api/dashboard';

interface MonitoreoEtapaCardProps {
  etapa: DashboardEtapa;
}

export function MonitoreoEtapaCard({ etapa }: MonitoreoEtapaCardProps) {
  const isUltimoOk = etapa.ultimoPeso >= etapa.pesoMinimo && etapa.ultimoPeso <= etapa.pesoMaximo;
  const estadoColor = isUltimoOk ? 'text-success' : 'text-destructive';

  const muestrasOk = etapa.timeSeries.filter(m => m.peso >= etapa.pesoMinimo && m.peso <= etapa.pesoMaximo).length;
  const muestrasFuera = etapa.timeSeries.length - muestrasOk;

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
        <div className="absolute left-0 right-12 h-px bg-amber-500/60" style={{ top: '25%' }} />
        <span className="absolute right-1 text-[9px] font-semibold text-amber-500 font-mono" style={{ top: '22%' }}>MÁX {etapa.pesoMaximo}</span>

        {/* Ideal line */}
        <div className="absolute left-0 right-12 h-px bg-cyan-400" style={{ top: '50%' }} />
        <span className="absolute right-1 text-[9px] font-semibold text-cyan-400 font-mono" style={{ top: '47%' }}>IDEAL {etapa.pesoIdeal}</span>

        {/* Min line */}
        <div className="absolute left-0 right-12 h-px bg-amber-500/60" style={{ bottom: '25%' }} />
        <span className="absolute right-1 text-[9px] font-semibold text-amber-500 font-mono" style={{ bottom: '22%' }}>MÍN {etapa.pesoMinimo}</span>

        {/* Data points */}
        <div className="absolute inset-0 right-12">
          {etapa.timeSeries.map((muestra, i) => {
            const normX = (i / Math.max(etapa.timeSeries.length - 1, 1)) * 100;
            const range = etapa.pesoMaximo - etapa.pesoMinimo;
            const normY = range > 0 ? 75 - (((muestra.peso - etapa.pesoMinimo) / range) * 50) : 50;
            const isOk = muestra.peso >= etapa.pesoMinimo && muestra.peso <= etapa.pesoMaximo;
            const color = isOk ? 'bg-success border-card' : 'bg-destructive border-card';
            return (
              <div
                key={i}
                className={`absolute border-2 w-3.5 h-3.5 rounded-full ${color}`}
                style={{ left: `${normX}%`, top: `${Math.max(2, Math.min(98, normY))}%`, transform: 'translate(-50%, -50%)' }}
                title={`${muestra.peso.toFixed(1)}g · ${isOk ? 'OK' : 'Fuera'}`}
              />
            );
          })}
        </div>
      </div>

      {/* Time axis */}
      <div className="flex justify-between mb-3 mr-12">
        {etapa.timeSeries.length > 0 && (
          <>
            <span className="text-[9px] text-muted-foreground font-mono tabular-nums">
              {new Date(etapa.timeSeries[0]?.time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[9px] text-muted-foreground font-mono tabular-nums">
              {new Date(etapa.timeSeries[etapa.timeSeries.length - 1]?.time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </>
        )}
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
