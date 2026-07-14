import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import type { DashboardLineaResumen } from '../../../api/dashboard';

interface MonitoreoLineHeaderProps {
  resumen: DashboardLineaResumen;
  lineaNombre: string;
  rutaActivaNombre: string | null;
  isFullscreen: boolean;
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

export function MonitoreoLineHeader({ resumen, lineaNombre, rutaActivaNombre, isFullscreen, onLineaChange, onFullscreen }: MonitoreoLineHeaderProps) {
  const tiempoInicial = resumen.pasadaEnCurso?.tiempoTranscurrido ? Math.floor(resumen.pasadaEnCurso.tiempoTranscurrido / 1000) : 0;
  const [elapsed, setElapsed] = useState(tiempoInicial);

  useEffect(() => {
    setElapsed(tiempoInicial);
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [tiempoInicial]);

  const handlePrev = useCallback(() => onLineaChange(-1), [onLineaChange]);
  const handleNext = useCallback(() => onLineaChange(1), [onLineaChange]);

  return (
    <div className="bg-card border border-border rounded-2xl px-5 py-3 flex items-center gap-4 flex-shrink-0">
      {/* Left nav */}
      <button onClick={handlePrev} className="p-1 text-muted-foreground hover:text-foreground flex-shrink-0" aria-label="Línea anterior">
        <ChevronLeft size={22} />
      </button>

      {/* Line info — prominent */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">LÍNEA Y RUTA ACTIVA</p>
        <p className="text-base font-bold text-foreground truncate">
          <span className="text-cyan-400">{lineaNombre}</span>
          <span className="text-muted-foreground mx-2">·</span>
          <span className="text-foreground/80">{rutaActivaNombre ?? 'Sin ruta activa'}</span>
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
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0 min-w-[120px]">
        <div className="flex items-center gap-2">
          {resumen.conectado && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              EN VIVO
            </span>
          )}
        </div>
        <span className="text-xl font-bold text-foreground font-mono tabular-nums">{formatElapsed(elapsed)}</span>
      </div>
    </div>
  );
}
