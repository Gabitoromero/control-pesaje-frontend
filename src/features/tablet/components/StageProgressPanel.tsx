import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import type { EtapaConEstado } from '../hooks/usePasadaState';

interface StageProgressPanelProps {
  etapasConEstado: EtapaConEstado[];
}

export const StageProgressPanel: React.FC<StageProgressPanelProps> = ({ etapasConEstado }) => {
  if (!etapasConEstado || etapasConEstado.length === 0) return null;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4" data-testid="stage-progress-panel">
      <div className="flex flex-row items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {etapasConEstado.map((e, index) => {
          const isLast = index === etapasConEstado.length - 1;
          const { etapa, estado, muestrasOk, muestrasRequeridas } = e;

          let bgClass = '';
          let textClass = '';
          let borderClass = '';
          let icon = null;
          let counterText = null;

          if (estado === 'completada') {
            bgClass = 'bg-emerald-50';
            textClass = 'text-emerald-700';
            borderClass = 'border-emerald-200';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
          } else if (estado === 'actual') {
            bgClass = 'bg-blue-50';
            textClass = 'text-blue-700 font-semibold';
            borderClass = 'border-blue-300 ring-2 ring-blue-500/20';
            icon = <Circle className="w-5 h-5 text-blue-500 fill-blue-500/20" />;
            counterText = `${muestrasOk} / ${muestrasRequeridas} muestras OK`;
          } else {
            bgClass = 'bg-slate-50 opacity-50 pointer-events-none';
            textClass = 'text-slate-500';
            borderClass = 'border-slate-200 dashed';
            icon = <Circle className="w-5 h-5 text-slate-300" />;
          }

          return (
            <React.Fragment key={etapa.id ?? index}>
              <div className={`flex flex-col flex-shrink-0 min-w-[160px] p-3 rounded-lg border ${bgClass} ${textClass} ${borderClass}`}>
                <div className="flex items-center gap-2 mb-1">
                  {icon}
                  <span className="text-sm">{etapa.nombre}</span>
                </div>
                {counterText && (
                  <span className="text-xs font-medium text-blue-600 pl-7">
                    {counterText}
                  </span>
                )}
              </div>
              
              {!isLast && (
                <div className="flex-shrink-0 w-4 h-[2px] bg-slate-200" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
