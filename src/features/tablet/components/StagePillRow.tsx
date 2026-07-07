import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import type { Muestra, RutaPasadaEtapa } from '../../../shared/types/domain';
import { deriveStageProgress } from '../utils/stageProgress';

const MAX_VISIBLE_DONE = 3;

const PILL_STATE = { DONE: 'done', CURRENT: 'current' } as const;
type PillState = (typeof PILL_STATE)[keyof typeof PILL_STATE];

interface StagePillRowProps {
  etapas: RutaPasadaEtapa[];
  muestras: Muestra[];
}

function pillClassName(state: PillState): string {
  if (state === PILL_STATE.DONE) {
    return 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-success-muted text-success';
  }
  return 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary';
}

export const StagePillRow: React.FC<StagePillRowProps> = ({ etapas, muestras }) => {
  const progress = deriveStageProgress(etapas, muestras);

  if (progress.total === 0) return null;

  const hiddenDoneCount = Math.max(progress.done.length - MAX_VISIBLE_DONE, 0);
  const visibleDone = progress.done.slice(hiddenDoneCount);

  return (
    <div className="flex flex-row items-center gap-1.5 flex-wrap" data-testid="stage-pill-row">
      {hiddenDoneCount > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-muted text-muted-foreground">
          +{hiddenDoneCount}
        </span>
      )}
      {visibleDone.map((etapa) => (
        <span key={etapa.id ?? etapa.etapa.id} className={pillClassName(PILL_STATE.DONE)}>
          <Check className="w-3 h-3" />
          <span className="max-w-[80px] truncate">{etapa.etapa.nombre}</span>
        </span>
      ))}
      {progress.current && (
        <span className={pillClassName(PILL_STATE.CURRENT)}>
          <ArrowRight className="w-3 h-3" />
          <span className="max-w-[80px] truncate">{progress.current.etapa.nombre}</span>
        </span>
      )}
    </div>
  );
};
