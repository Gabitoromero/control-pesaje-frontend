import type { DashboardEtapa } from '../../../api/dashboard';

interface MonitoreoEtapaCardProps {
  etapa: DashboardEtapa;
}

export function MonitoreoEtapaCard({ etapa }: MonitoreoEtapaCardProps) {
  const estadoColor = etapa.ultimoPesoEstado === 'ok' ? 'text-success' : 'text-destructive';

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex-shrink-0 w-[432px]">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ETAPA</p>
          <h3 className="text-lg font-bold text-foreground">{etapa.etapaNombre}</h3>
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
            {etapa.porcentajeConforme}% conforme
          </p>
        </div>
      </div>

      {/* Scatter chart area */}
      <div className="relative h-[125px] bg-accent/30 rounded-sm mb-4 border border-border">
        {/* Tolerance band */}
        <div className="absolute left-0 right-0 bg-success/10" style={{ top: `${((etapa.pesoMaximo - etapa.pesoMaximo) / (etapa.pesoMaximo - etapa.pesoMinimo)) * 100}%`, bottom: `${((etapa.pesoMinimo - etapa.pesoMinimo) / (etapa.pesoMaximo - etapa.pesoMinimo)) * 100}%` }} />

        {/* Max line */}
        <div className="absolute left-0 right-0 h-px bg-amber-500/60 top-0" />
        <span className="absolute right-1 top-0 text-[9px] font-semibold text-amber-500 font-mono">MÁX {etapa.pesoMaximo}</span>

        {/* Ideal line */}
        <div className="absolute left-0 right-0 h-px bg-cyan-400" style={{ top: '50%' }} />
        <span className="absolute right-1 text-[9px] font-semibold text-cyan-400 font-mono" style={{ top: '48%' }}>IDEAL {etapa.pesoIdeal}</span>

        {/* Min line */}
        <div className="absolute left-0 right-0 h-px bg-amber-500/60 bottom-0" />
        <span className="absolute right-1 bottom-0 text-[9px] font-semibold text-amber-500 font-mono">MÍN {etapa.pesoMinimo}</span>

        {/* Data points */}
        <div className="absolute inset-0">
          {etapa.muestras.map((muestra, i) => {
            const normX = (i / Math.max(etapa.muestras.length - 1, 1)) * 100;
            const range = etapa.pesoMaximo - etapa.pesoMinimo;
            const normY = range > 0 ? 100 - (((muestra.pesoNeto - etapa.pesoMinimo) / range) * 100) : 50;
            const isOk = muestra.estadoValidacion === 'ok';
            const isLibre = muestra.tipo === 'libre';
            const color = isOk ? 'bg-success border-card' : 'bg-destructive border-card';
            const size = isLibre ? 'w-2 h-2 rotate-45' : 'w-2.5 h-2.5 rounded-full';
            return (
              <div
                key={i}
                className={`absolute border-2 ${size} ${color}`}
                style={{ left: `${normX}%`, top: `${Math.max(2, Math.min(98, normY))}%`, transform: 'translate(-50%, -50%)' + (isLibre ? ' rotate(45deg)' : '') }}
                title={`${muestra.pesoNeto.toFixed(1)}g · ${isOk ? 'OK' : 'Fuera'} · ${muestra.tipo}`}
              />
            );
          })}
        </div>
      </div>

      {/* Time axis */}
      <div className="flex justify-between mb-3">
        {etapa.muestras.length > 0 && (
          <>
            <span className="text-[9px] text-muted-foreground font-mono tabular-nums">
              {new Date(etapa.muestras[0]?.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[9px] text-muted-foreground font-mono tabular-nums">
              {new Date(etapa.muestras[etapa.muestras.length - 1]?.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex justify-between items-center pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground font-mono">{etapa.totalMuestras} muestras desde el cambio de ruta</span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono">
            <span className="text-success">● </span>
            <span className="text-muted-foreground">{etapa.muestrasOk} ok</span>
          </span>
          <span className="text-xs font-mono">
            <span className="text-destructive">● </span>
            <span className="text-muted-foreground">{etapa.muestrasFuera} fuera</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            <span className="text-success">●</span> pasada <span className="text-success ml-1">◆</span> libre
          </span>
        </div>
      </div>
    </div>
  );
}
