import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import type { EtapaConEstado } from '../utils/stageProgress';

/** How long the celebratory/neutral transition signal stays active before
 * auto-resetting to `none`. Consumers (stepper, samples panel, flash overlay)
 * use this window to play their transition and then settle back to steady state. */
const SIGNAL_DURATION_MS = 600;

export type StageAdvanceSignal =
  | { kind: 'none' }
  | { kind: 'forward'; etapaId: number; nombre: string }
  | { kind: 'backward'; etapaId: number; nombre: string };

const NONE_SIGNAL: StageAdvanceSignal = { kind: 'none' };

function findActiva(etapasConEstado: EtapaConEstado[]): EtapaConEstado | null {
  return etapasConEstado.find((e) => e.estado === 'actual') ?? null;
}

/**
 * Classifies transitions of the derived active etapa as `forward` (a new,
 * later-`orden` etapa becomes active — the normal auto-advance case) or
 * `backward` (a delete-driven regression re-activates an earlier etapa).
 * Returns `none` on the initial render, when the active etapa id does not
 * change, and always under `prefers-reduced-motion` (spec: regression must
 * stay silent/non-alarming, and neither transition may rely on motion for
 * users who disabled it).
 */
export function useStageAdvanceSignal(etapasConEstado: EtapaConEstado[]): StageAdvanceSignal {
  const prefersReducedMotion = useReducedMotion();
  const prevActivaRef = useRef<EtapaConEstado | null | undefined>(undefined);
  const [signal, setSignal] = useState<StageAdvanceSignal>(NONE_SIGNAL);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activa = findActiva(etapasConEstado);

  useEffect(() => {
    const prevActiva = prevActivaRef.current;
    prevActivaRef.current = activa;

    // First render: nothing to compare against yet.
    if (prevActiva === undefined) {
      return;
    }

    const prevId = prevActiva?.etapa.etapa.id ?? null;
    const nextId = activa?.etapa.etapa.id ?? null;

    // Only classify a transition between two REAL active etapas. Settling
    // from "no active etapa yet" (null — e.g. data still loading, or a fresh
    // pasada being wired up) into the first real actual is not a celebratory
    // advance and must not fire the flash.
    if (prevId === nextId || activa === null || prevActiva === null || prefersReducedMotion) {
      setSignal(NONE_SIGNAL);
      return;
    }

    const prevOrden = prevActiva?.etapa.orden ?? -Infinity;
    const nextOrden = activa.etapa.orden;
    const kind = nextOrden > prevOrden ? 'forward' : 'backward';

    setSignal({ kind, etapaId: activa.etapa.etapa.id, nombre: activa.etapa.etapa.nombre });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSignal(NONE_SIGNAL);
    }, SIGNAL_DURATION_MS);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa?.etapa.etapa.id]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return signal;
}
