import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DashboardEtapa } from '../../../api/dashboard';
import { MonitoreoEtapaCard } from './MonitoreoEtapaCard';

interface MonitoreoEtapasCarouselProps {
  etapas: DashboardEtapa[];
}

export function MonitoreoEtapasCarousel({ etapas }: MonitoreoEtapasCarouselProps) {
  const [index, setIndex] = useState(0);

  if (etapas.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground">
        No hay etapas configuradas para la ruta activa.
      </div>
    );
  }

  const current = etapas[index];

  const goPrev = () => setIndex((i) => (i > 0 ? i - 1 : etapas.length - 1));
  const goNext = () => setIndex((i) => (i < etapas.length - 1 ? i + 1 : 0));

  return (
    <div className="flex items-stretch gap-3">
      {/* Left arrow */}
      {etapas.length > 1 && (
        <button
          onClick={goPrev}
          className="flex-shrink-0 w-10 flex items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground"
          aria-label="Etapa anterior"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Current etapa card — fills remaining space */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        <MonitoreoEtapaCard etapa={current} />

        {/* Dots + name indicator */}
        <div className="flex items-center justify-center gap-2">
          {etapas.map((e, i) => (
            <button
              key={e.etapaId}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === index ? 'bg-cyan-400' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Etapa ${e.etapaNombre}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2 font-mono">{current.etapaNombre}</span>
        </div>
      </div>

      {/* Right arrow */}
      {etapas.length > 1 && (
        <button
          onClick={goNext}
          className="flex-shrink-0 w-10 flex items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground"
          aria-label="Etapa siguiente"
        >
          <ChevronRight size={22} />
        </button>
      )}
    </div>
  );
}
