import type { Muestra, RutaPasadaEtapa } from '../../../shared/types/domain';

export interface StageProgress {
  /** Leading consecutive etapas (by orden) whose required sample count has been satisfied. */
  done: RutaPasadaEtapa[];
  /** First etapa (by orden) that is not yet satisfied, or null when every etapa is done. */
  current: RutaPasadaEtapa | null;
  /** Count of etapas after the current one. */
  pendingCount: number;
  /** 1-based position of the current etapa (or of the last etapa when all are done). */
  currentIndex: number;
  /** Total number of etapas in the route. */
  total: number;
}

function isEtapaSatisfied(etapa: RutaPasadaEtapa, muestras: Muestra[]): boolean {
  const okCount = muestras.filter(
    (m) => m.etapaId === etapa.etapa.id && m.estadoValidacion === 'ok'
  ).length;
  return okCount >= etapa.cantidadMuestrasRequeridas;
}

export function deriveStageProgress(etapas: RutaPasadaEtapa[], muestras: Muestra[]): StageProgress {
  const total = etapas.length;

  if (total === 0) {
    return { done: [], current: null, pendingCount: 0, currentIndex: 0, total: 0 };
  }

  const orderedEtapas = [...etapas].sort((a, b) => a.orden - b.orden);

  const done: RutaPasadaEtapa[] = [];
  let current: RutaPasadaEtapa | null = null;

  for (const etapa of orderedEtapas) {
    if (current === null && isEtapaSatisfied(etapa, muestras)) {
      done.push(etapa);
    } else if (current === null) {
      current = etapa;
    }
  }

  const currentIndex = current ? done.length + 1 : total;
  const pendingCount = total - done.length - (current ? 1 : 0);

  return { done, current, pendingCount, currentIndex, total };
}
