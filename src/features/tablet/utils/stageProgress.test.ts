import { describe, it, expect } from 'vitest';
import { deriveStageProgress, deriveEtapasConEstado } from './stageProgress';
import type { RutaPasadaEtapa, Muestra } from '../../../shared/types/domain';

function makeEtapa(id: number, orden: number, cantidadMuestrasRequeridas: number): RutaPasadaEtapa {
  return {
    id,
    etapa: { id, nombre: `Etapa ${id}` },
    orden,
    pesoMinimo: 0,
    pesoIdeal: 0,
    pesoMaximo: 0,
    cantidadMuestrasRequeridas,
  };
}

function makeMuestra(etapaId: number, estadoValidacion: Muestra['estadoValidacion'] = 'ok'): Muestra {
  return {
    pesoNeto: 10,
    estadoValidacion,
    usuarioId: 1,
    etapaId,
    lineaProduccionId: 1,
    timestamp: new Date().toISOString(),
  };
}

describe('deriveStageProgress', () => {
  it('returns first etapa as current and rest as pending when there are zero muestras', () => {
    const etapas = [makeEtapa(1, 1, 2), makeEtapa(2, 2, 2), makeEtapa(3, 3, 2)];

    const result = deriveStageProgress(etapas, []);

    expect(result.done).toEqual([]);
    expect(result.current).toEqual(etapas[0]);
    expect(result.currentIndex).toBe(1);
    expect(result.total).toBe(3);
    expect(result.pendingCount).toBe(2);
  });

  it('marks leading consecutive satisfied etapas as done and the next as current', () => {
    const etapas = [makeEtapa(1, 1, 2), makeEtapa(2, 2, 2), makeEtapa(3, 3, 2), makeEtapa(4, 4, 2), makeEtapa(5, 5, 2)];
    const muestras = [
      makeMuestra(1), makeMuestra(1),
      makeMuestra(2), makeMuestra(2),
    ];

    const result = deriveStageProgress(etapas, muestras);

    expect(result.done).toEqual([etapas[0], etapas[1]]);
    expect(result.current).toEqual(etapas[2]);
    expect(result.currentIndex).toBe(3);
    expect(result.total).toBe(5);
    expect(result.pendingCount).toBe(2);
  });

  it('marks all etapas as done and current as null when every stage is satisfied', () => {
    const etapas = [makeEtapa(1, 1, 1), makeEtapa(2, 2, 1)];
    const muestras = [makeMuestra(1), makeMuestra(2)];

    const result = deriveStageProgress(etapas, muestras);

    expect(result.done).toEqual(etapas);
    expect(result.current).toBeNull();
    expect(result.currentIndex).toBe(2);
    expect(result.total).toBe(2);
    expect(result.pendingCount).toBe(0);
  });

  it('returns empty progress when etapas is empty', () => {
    const result = deriveStageProgress([], []);

    expect(result.done).toEqual([]);
    expect(result.current).toBeNull();
    expect(result.currentIndex).toBe(0);
    expect(result.total).toBe(0);
    expect(result.pendingCount).toBe(0);
  });

  it('does not count muestras with a non-ok estadoValidacion toward satisfying a stage', () => {
    const etapas = [makeEtapa(1, 1, 2), makeEtapa(2, 2, 1)];
    const muestras = [makeMuestra(1, 'ok'), makeMuestra(1, 'fuera_de_rango'), makeMuestra(1, 'descartado')];

    const result = deriveStageProgress(etapas, muestras);

    expect(result.done).toEqual([]);
    expect(result.current).toEqual(etapas[0]);
    expect(result.currentIndex).toBe(1);
    expect(result.pendingCount).toBe(1);
  });

  it('ignores muestras that do not match any known etapaId order but respects orden regardless of array order', () => {
    const etapas = [makeEtapa(2, 2, 1), makeEtapa(1, 1, 1)];
    const muestras = [makeMuestra(1)];

    const result = deriveStageProgress(etapas, muestras);

    expect(result.done).toEqual([etapas[1]]);
    expect(result.current).toEqual(etapas[0]);
    expect(result.currentIndex).toBe(2);
    expect(result.total).toBe(2);
  });
});

describe('deriveEtapasConEstado', () => {
  it('returns an empty array when there are no etapas', () => {
    expect(deriveEtapasConEstado([], [])).toEqual([]);
  });

  it('marks the first etapa as actual and the rest as pendiente when there are zero muestras', () => {
    const etapas = [makeEtapa(1, 1, 2), makeEtapa(2, 2, 1), makeEtapa(3, 3, 1)];

    const result = deriveEtapasConEstado(etapas, []);

    expect(result.map((e) => e.estado)).toEqual(['actual', 'pendiente', 'pendiente']);
    expect(result[0]).toMatchObject({ muestrasOk: 0, muestrasRequeridas: 2 });
  });

  it('marks a satisfied leading etapa as completada and the next unsatisfied one as actual', () => {
    const etapas = [makeEtapa(1, 1, 2), makeEtapa(2, 2, 1)];
    const muestras = [makeMuestra(1), makeMuestra(1)];

    const result = deriveEtapasConEstado(etapas, muestras);

    expect(result[0]).toMatchObject({ estado: 'completada', muestrasOk: 2, muestrasRequeridas: 2 });
    expect(result[1]).toMatchObject({ estado: 'actual', muestrasOk: 0, muestrasRequeridas: 1 });
  });

  it('regresses a previously completada etapa back to actual and invalidates later etapas when its OK count drops below the requirement', () => {
    const etapas = [makeEtapa(1, 1, 3), makeEtapa(2, 2, 1)];
    // Etapa 1 previously had 3 OK samples (completada); now only 2 remain
    // after a delete, and etapa 2 independently has 1 OK sample recorded —
    // it MUST still be invalidated back to pendiente per spec.
    const muestras = [makeMuestra(1), makeMuestra(1), makeMuestra(2)];

    const result = deriveEtapasConEstado(etapas, muestras);

    expect(result[0]).toMatchObject({ estado: 'actual', muestrasOk: 2, muestrasRequeridas: 3 });
    expect(result[1]).toMatchObject({ estado: 'pendiente', muestrasOk: 1, muestrasRequeridas: 1 });
  });
});
