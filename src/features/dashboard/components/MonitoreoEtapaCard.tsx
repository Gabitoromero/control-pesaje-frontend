import type { DashboardEtapa } from '../../../api/dashboard';
import { PESO_DECIMALS } from '../../../shared/constants';
import { unidadLabel } from '../../../shared/peso';
import { SECTORES, SECTOR_NEUTRAL_COLOR, getSectorColor, getSectorLabel } from '../../../lib/sectores';

// Thick bright red ring separated from the fill by a white gap, so it stays
// distinguishable from the burgundy (DD) fill and from the other sector colors.
const FUERA_RANGO_RING = '0 0 0 2px #ffffff, 0 0 0 5px #ff1f1f';

interface MonitoreoEtapaCardProps {
  etapa: DashboardEtapa;
  rutaAsignadaAt: string | null;
  ahora: string;
}

export function MonitoreoEtapaCard({ etapa, rutaAsignadaAt, ahora }: MonitoreoEtapaCardProps) {
  const isUltimoOk = etapa.ultimoPeso >= etapa.pesoMinimo && etapa.ultimoPeso <= etapa.pesoMaximo;
  const estadoColor = isUltimoOk ? 'text-success' : 'text-destructive';
  // Label only: a volumen etapa reads mL where a peso etapa reads g (same values).
  const unidad = unidadLabel('g', etapa.magnitud);

  // Use precalculated counts from the backend response
  const muestrasTotales = etapa.muestrasTotales;
  const muestrasOk = etapa.muestrasConformes;
  const muestrasFuera = etapa.muestrasFueraRango;

  // Legend: only the sectors that actually appear in this chart (fill = sector, red ring = out of range).
  const codigosPresentes = new Set(etapa.timeSeries.map((m) => m.sector));
  const sectoresPresentes = SECTORES.filter((s) => codigosPresentes.has(s.codigo));
  const haySinSector = etapa.timeSeries.some((m) => !SECTORES.some((s) => s.codigo === m.sector));

  const x1 = (() => {
    if (rutaAsignadaAt) {
      return new Date(rutaAsignadaAt).getTime();
    }
    if (etapa.timeSeries.length > 0) {
      return new Date(etapa.timeSeries[0].time).getTime();
    }
    // Calculate fallback relative to 'ahora' instead of impure Date.now()
    const fallbackBase = new Date(ahora).getTime();
    return fallbackBase - 3600000;
  })();

  const x2 = (() => {
    const nowLimit = new Date(ahora).getTime();
    return nowLimit > x1 + 1000 ? nowLimit : x1 + 1001;
  })();

  return (
    <div className="w-full flex flex-col flex-1 min-h-0 h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ETAPA</p>
          <h3 className="text-lg font-bold text-foreground">{etapa.etapa.nombre}</h3>
          <p className="text-[11px] text-muted-foreground font-mono hidden md:block">
            rango {etapa.pesoMinimo}–{etapa.pesoMaximo} {unidad} · ideal {etapa.pesoIdeal} {unidad}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{etapa.magnitud === 'volumen' ? 'ÚLTIMO VOLUMEN' : 'ÚLTIMO PESO'}</p>
          <p data-testid="ultimo-peso" className={`text-2xl font-bold font-mono ${estadoColor}`}>
            {etapa.ultimoPeso > 0 || etapa.timeSeries.length > 0
              ? (etapa.ultimoPeso > 0 ? etapa.ultimoPeso : Number(etapa.timeSeries[etapa.timeSeries.length - 1]?.peso)).toFixed(PESO_DECIMALS)
              : '—'}
            <span className="text-sm font-normal text-muted-foreground"> {unidad}</span>
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
            // Pasada samples: filled circle. Free samples: smaller, dimmed, diamond shape (rotate-45 + no border-radius/rounded).
            // Fill = sector of the user who weighed it; out-of-range samples add a red ring.
            const shapeClass = isLibre ? 'w-2.5 h-2.5 opacity-60 rotate-45' : 'w-3.5 h-3.5 rounded-full';
            const sectorLabel = getSectorLabel(muestra.sector);
            const label = `${muestra.peso.toFixed(1)}${unidad} · ${isOk ? 'OK' : 'Fuera'}${isLibre ? ' · muestra libre' : ''}${sectorLabel ? ` · ${sectorLabel}` : ''}`;
            return (
              <div
                key={i}
                className={`absolute border-2 border-card ${shapeClass}`}
                data-fuera-rango={isOk ? undefined : 'true'}
                style={{
                  left: `${normX}%`,
                  top: `${Math.max(2, Math.min(98, normY))}%`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: getSectorColor(muestra.sector),
                  boxShadow: isOk ? undefined : FUERA_RANGO_RING,
                }}
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
        <span className="text-xs text-muted-foreground font-mono hidden sm:inline-block">{muestrasTotales} muestras desde el inicio</span>
        <div data-testid="monitoreo-leyenda" className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          {sectoresPresentes.map((s) => (
            <span key={s.codigo} className="inline-flex items-center gap-1 text-xs font-mono">
              <span aria-hidden="true" style={{ color: s.color }}>●</span>
              <span className="text-muted-foreground">{s.label}</span>
            </span>
          ))}
          {haySinSector && (
            <span className="inline-flex items-center gap-1 text-xs font-mono">
              <span aria-hidden="true" style={{ color: SECTOR_NEUTRAL_COLOR }}>●</span>
              <span className="text-muted-foreground">Sin sector</span>
            </span>
          )}
          <span className="text-xs font-mono text-muted-foreground">{muestrasOk} ok</span>
          <span data-testid="leyenda-fuera-rango" className="inline-flex items-center gap-1 text-xs font-mono">
            <span
              data-testid="leyenda-anillo"
              aria-hidden="true"
              className="mx-1 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: SECTOR_NEUTRAL_COLOR, boxShadow: FUERA_RANGO_RING }}
            />
            <span className="text-muted-foreground">{muestrasFuera} fuera de rango</span>
          </span>
        </div>
      </div>
    </div>
  );
}
