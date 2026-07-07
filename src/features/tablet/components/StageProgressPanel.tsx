import React, { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import type { EtapaConEstado } from '../hooks/usePasadaState';

interface StageProgressPanelProps {
  etapasConEstado: EtapaConEstado[];
}

export const StageProgressPanel: React.FC<StageProgressPanelProps> = ({ etapasConEstado }) => {
  const activeRef = useRef<HTMLDivElement | null>(null);
  const activeEtapaId = etapasConEstado?.find((e) => e.estado === 'actual')?.etapa.etapa.id ?? null;

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeEtapaId]);

  if (!etapasConEstado || etapasConEstado.length === 0) return null;

  return (
    <div className="w-full bg-card rounded-xl shadow-sm border border-border p-4" data-testid="stage-progress-panel">
      <div className="flex flex-row items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {etapasConEstado.map((e, index) => {
          const isLast = index === etapasConEstado.length - 1;
          const { etapa, estado, muestrasOk, muestrasRequeridas } = e;

          let circleClass: string;
          let labelClass: string;
          let content: React.ReactNode;
          let counterText: string | null = null;

          if (estado === 'completada') {
            circleClass = 'bg-success text-white';
            labelClass = 'text-success';
            content = <Check className="w-4 h-4" />;
          } else if (estado === 'actual') {
            circleClass = 'bg-card border-2 border-primary ring-2 ring-primary/20 text-primary';
            labelClass = 'text-foreground font-semibold';
            content = index + 1;
            counterText = `${muestrasOk} / ${muestrasRequeridas} muestras OK`;
          } else {
            circleClass = 'bg-muted text-muted-foreground';
            labelClass = 'text-muted-foreground';
            content = index + 1;
          }

          const passed = estado === 'completada';

          return (
            <React.Fragment key={etapa.id ?? index}>
              <div
                ref={estado === 'actual' ? activeRef : undefined}
                className="flex flex-col items-center flex-shrink-0 min-w-[64px]"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${circleClass}`}
                >
                  {content}
                </div>
                <span className={`mt-1 text-xs text-center max-w-[72px] truncate ${labelClass}`}>
                  {etapa.etapa.nombre}
                </span>
                {counterText && (
                  <span className="text-xs font-medium text-primary">
                    {counterText}
                  </span>
                )}
              </div>

              {!isLast && (
                <div className={`flex-1 h-[2px] ${passed ? 'bg-success' : 'bg-border'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
