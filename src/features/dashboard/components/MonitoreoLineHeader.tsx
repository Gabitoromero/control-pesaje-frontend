import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import type { DashboardLineaResumen } from '../../../api/dashboard';

interface MonitoreoLineHeaderProps {
  resumen: DashboardLineaResumen;
  onLineaChange: (delta: 1 | -1) => void;
  onFullscreen: () => void;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function MonitoreoLineHeader({ resumen, onLineaChange, onFullscreen }: MonitoreoLineHeaderProps) {
  const [elapsed, setElapsed] = useState(resumen.tiempoTranscurrido);

  useEffect(() => {
    setElapsed(resumen.tiempoTranscurrido);
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resumen.tiempoTranscurrido]);

  const handlePrev = useCallback(() => onLineaChange(-1), [onLineaChange]);
  const handleNext = useCallback(() => onLineaChange(1), [onLineaChange]);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
      {/* Left nav */}
      <button onClick={handlePrev} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Línea anterior">
        <ChevronLeft size={20} />
      </button>

      {/* Line info */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">LÍNEA Y RUTA ACTIVA</p>
        <h2 className="text-xl font-bold text-foreground truncate">
          {resumen.lineaNombre} · {resumen.rutaActivaNombre}
        </h2>
      </div>

      {/* Right nav */}
      <button onClick={handleNext} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Línea siguiente">
        <ChevronRight size={20} />
      </button>

      {/* Fullscreen */}
      <button onClick={onFullscreen} className="p-1.5 rounded-lg bg-accent hover:bg-accent/80 text-muted-foreground" aria-label="Pantalla completa">
        <Maximize2 size={16} />
      </button>

      {/* Live badge + timer */}
      <div className="flex flex-col items-end gap-0.5 min-w-[140px]">
        <div className="flex items-center gap-2">
          {resumen.conectado && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              EN VIVO
            </span>
          )}
        </div>
        <span className="text-2xl font-bold text-foreground font-mono tabular-nums">{formatElapsed(elapsed)}</span>
        <span className="text-[11px] text-muted-foreground font-mono">en esta ruta · desde {new Date(resumen.horaInicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}
