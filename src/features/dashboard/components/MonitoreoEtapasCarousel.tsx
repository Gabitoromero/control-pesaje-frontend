import React, { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DashboardEtapa } from '../../../api/dashboard';
import { MonitoreoEtapaCard } from './MonitoreoEtapaCard';

interface MonitoreoEtapasCarouselProps {
  etapas: DashboardEtapa[];
}

export function MonitoreoEtapasCarousel({ etapas }: MonitoreoEtapasCarouselProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const scrollBy = useCallback((delta: number) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: delta * 452, behavior: 'smooth' });
    }
  }, []);

  if (etapas.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground">
        No hay etapas configuradas para la ruta activa.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Left arrow */}
      <button
        onClick={() => scrollBy(-1)}
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
        aria-label="Etapa anterior"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Scrollable row */}
      <div
        ref={containerRef}
        className="flex gap-5 overflow-x-auto pb-2 scrollbar-thin"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {etapas.map((etapa) => (
          <div key={etapa.etapaId} style={{ scrollSnapAlign: 'start' }}>
            <MonitoreoEtapaCard etapa={etapa} />
          </div>
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scrollBy(1)}
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
        aria-label="Etapa siguiente"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5 mt-2">
        {etapas.map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-cyan-400' : 'bg-muted-foreground/30'}`} />
        ))}
      </div>
    </div>
  );
}
