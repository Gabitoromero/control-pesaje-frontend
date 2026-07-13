import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

  useEffect(() => {
    if (etapas.length <= 1) return;
    const rotationTime = 60000 / etapas.length;
    const interval = setInterval(() => {
      goNext();
    }, rotationTime);
    return () => clearInterval(interval);
  }, [etapas.length, index]);

  return (
    <div className="flex items-stretch gap-3 h-full w-full flex-1">
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
      <div className="flex-1 flex flex-col gap-3 min-h-0 h-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.etapaId}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-1 flex flex-col min-h-0 h-full"
          >
            <MonitoreoEtapaCard etapa={current} />
          </motion.div>
        </AnimatePresence>

        {/* Story-style stage indicators */}
        <div className="mt-auto flex items-center justify-center gap-2 max-w-sm w-full mx-auto">
          {etapas.map((e, i) => (
            <div key={e.etapaId} className="flex-1 flex flex-col gap-1.5 cursor-pointer group" onClick={() => setIndex(i)}>
              <div className="h-1.5 w-full bg-muted-foreground/30 rounded-full overflow-hidden relative">
                <div
                  className={`absolute top-0 left-0 h-full bg-cyan-400 ${
                    i < index ? 'w-full' : i === index ? '' : 'w-0'
                  }`}
                  style={i === index ? { animation: `progress-fill ${60000 / etapas.length}ms linear forwards` } : {}}
                />
              </div>
              <span className={`text-[10px] font-mono text-center transition-colors ${i === index ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground/80'}`}>
                {e.etapaNombre}
              </span>
            </div>
          ))}
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
