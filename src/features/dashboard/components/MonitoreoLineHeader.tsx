import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import type { DashboardLineaResumen } from '../../../api/dashboard';

interface MonitoreoLineHeaderProps {
  resumen: DashboardLineaResumen;
  lineaNombre: string;
  rutaActivaNombre: string | null;
  isFullscreen: boolean;
  sinDispositivo?: boolean;
  onLineaChange: (delta: 1 | -1) => void;
  onFullscreen: () => void;
}

function formatElapsed(seconds: number): string {
  if (isNaN(seconds)) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function MonitoreoLineHeader({ resumen, lineaNombre, rutaActivaNombre, isFullscreen, sinDispositivo, onLineaChange, onFullscreen }: MonitoreoLineHeaderProps) {
  // Primary timer: time since the route was assigned to this line (x1).
  // Does NOT reset when a new pasada starts — only resets when the route changes.
  const rutaInitialSeconds = resumen.tiempoDesdeRuta != null
    ? Math.floor(resumen.tiempoDesdeRuta / 1000)
    : null;
  const [elapsedRuta, setElapsedRuta] = useState(rutaInitialSeconds ?? 0);

  useEffect(() => {
    if (rutaInitialSeconds === null) return;
    setElapsedRuta(rutaInitialSeconds);
    const timer = setInterval(() => setElapsedRuta((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [rutaInitialSeconds]);



  const handlePrev = useCallback(() => onLineaChange(-1), [onLineaChange]);
  const handleNext = useCallback(() => onLineaChange(1), [onLineaChange]);

  return (
    <div className="bg-card border border-border rounded-2xl px-5 py-3 flex flex-wrap md:flex-nowrap items-center gap-4 flex-shrink-0">
      {/* Left nav */}
      <button onClick={handlePrev} className="p-1 text-muted-foreground hover:text-foreground flex-shrink-0" aria-label="Línea anterior">
        <ChevronLeft size={22} />
      </button>

      {/* Line info — prominent */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">LÍNEA Y RUTA ACTIVA</p>
        <p className="text-base font-bold text-foreground truncate">
          <span className="text-primary">{lineaNombre}</span>
          <span className="text-muted-foreground mx-2">·</span>
          <span className="text-foreground/80">{rutaActivaNombre ?? 'Sin ruta activa'}</span>
          {sinDispositivo && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 text-warning text-[11px] font-semibold align-middle">
              Sin dispositivo
            </span>
          )}
        </p>
      </div>

      {/* Right nav */}
      <button onClick={handleNext} className="p-1 text-muted-foreground hover:text-foreground flex-shrink-0" aria-label="Línea siguiente">
        <ChevronRight size={22} />
      </button>

      {/* Fullscreen toggle */}
      <button
        onClick={onFullscreen}
        className="p-1.5 rounded-lg bg-accent hover:bg-accent/80 text-muted-foreground flex-shrink-0"
        aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
      >
        <Maximize2 size={16} />
      </button>

      {/* Live badge + timer */}
      <div className="flex flex-row md:flex-col justify-between md:justify-end items-center md:items-end gap-1 flex-shrink-0 w-full md:w-auto md:min-w-[120px] mt-2 md:mt-0 pt-2 md:pt-0 border-t border-border md:border-none">
        <div className="flex items-center gap-2">
          {resumen.conectado && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              EN VIVO
            </span>
          )}
        </div>
        {/* Primary: line timer since x1 */}
        <div className="flex flex-col items-end">
          <span className="text-xl font-bold text-foreground font-mono tabular-nums leading-none">
            {rutaInitialSeconds !== null ? formatElapsed(elapsedRuta) : '--:--:--'}
          </span>
        </div>
      </div>
    </div>
  );
}
