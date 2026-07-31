import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStageAdvanceSignal } from './useStageAdvanceSignal';
import type { EtapaConEstado } from '../utils/stageProgress';
import * as motionReact from 'motion/react';

vi.mock('motion/react', async () => {
  const actual = await vi.importActual<typeof import('motion/react')>('motion/react');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

const makeEtapas = (activeOrden: number): EtapaConEstado[] => {
  const etapas: EtapaConEstado[] = [
    {
      etapa: { id: 10, orden: 1, pesoMinimo: 0, pesoIdeal: 0, pesoMaximo: 0, cantidadMuestrasRequeridas: 2, etapa: { id: 1, nombre: 'Amasado' } },
      estado: activeOrden === 1 ? 'actual' : activeOrden > 1 ? 'completada' : 'pendiente',
      muestrasOk: 0,
      muestrasRequeridas: 2,
    },
    {
      etapa: { id: 11, orden: 2, pesoMinimo: 0, pesoIdeal: 0, pesoMaximo: 0, cantidadMuestrasRequeridas: 1, etapa: { id: 2, nombre: 'Horneado' } },
      estado: activeOrden === 2 ? 'actual' : activeOrden > 2 ? 'completada' : 'pendiente',
      muestrasOk: 0,
      muestrasRequeridas: 1,
    },
    {
      etapa: { id: 12, orden: 3, pesoMinimo: 0, pesoIdeal: 0, pesoMaximo: 0, cantidadMuestrasRequeridas: 1, etapa: { id: 3, nombre: 'Enfriado' } },
      estado: activeOrden === 3 ? 'actual' : activeOrden > 3 ? 'completada' : 'pendiente',
      muestrasOk: 0,
      muestrasRequeridas: 1,
    },
  ];
  return etapas;
};

describe('useStageAdvanceSignal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(motionReact.useReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "none" on the initial render (no prior active etapa to compare)', () => {
    const { result } = renderHook(({ etapas }) => useStageAdvanceSignal(etapas), {
      initialProps: { etapas: makeEtapas(1) },
    });

    expect(result.current).toEqual({ kind: 'none' });
  });

  it('classifies a higher-orden active etapa as "forward" and carries its id/nombre', () => {
    const { result, rerender } = renderHook(({ etapas }) => useStageAdvanceSignal(etapas), {
      initialProps: { etapas: makeEtapas(1) },
    });

    rerender({ etapas: makeEtapas(2) });

    expect(result.current).toEqual({ kind: 'forward', etapaId: 2, nombre: 'Horneado' });
  });

  it('classifies a lower-orden active etapa (delete-driven regression) as "backward"', () => {
    const { result, rerender } = renderHook(({ etapas }) => useStageAdvanceSignal(etapas), {
      initialProps: { etapas: makeEtapas(2) },
    });

    rerender({ etapas: makeEtapas(1) });

    expect(result.current).toEqual({ kind: 'backward', etapaId: 1, nombre: 'Amasado' });
  });

  it('returns "none" when the active etapa id does not change across a rerender', () => {
    const { result, rerender } = renderHook(({ etapas }) => useStageAdvanceSignal(etapas), {
      initialProps: { etapas: makeEtapas(1) },
    });

    rerender({ etapas: makeEtapas(1) });

    expect(result.current).toEqual({ kind: 'none' });
  });

  it('resets to "none" automatically after the flash duration elapses', () => {
    const { result, rerender } = renderHook(({ etapas }) => useStageAdvanceSignal(etapas), {
      initialProps: { etapas: makeEtapas(1) },
    });

    rerender({ etapas: makeEtapas(2) });
    expect(result.current).toEqual({ kind: 'forward', etapaId: 2, nombre: 'Horneado' });

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current).toEqual({ kind: 'none' });
  });

  it('always returns "none" when prefers-reduced-motion is enabled, even across a real transition', () => {
    vi.mocked(motionReact.useReducedMotion).mockReturnValue(true);

    const { result, rerender } = renderHook(({ etapas }) => useStageAdvanceSignal(etapas), {
      initialProps: { etapas: makeEtapas(1) },
    });

    rerender({ etapas: makeEtapas(2) });

    expect(result.current).toEqual({ kind: 'none' });
  });
});
