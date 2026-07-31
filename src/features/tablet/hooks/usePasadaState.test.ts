import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePasadaState } from './usePasadaState';
import { registrarMuestra, deleteMuestra, updateMuestra } from '../../../api/muestras';
import type { Muestra, RutaPasadaEtapa } from '../../../shared/types/domain';

vi.mock('../../../api/muestras', () => ({
  registrarMuestra: vi.fn(),
  deleteMuestra: vi.fn(),
  updateMuestra: vi.fn(),
}));

const mockEtapas: RutaPasadaEtapa[] = [
  {
    etapa: { id: 10, nombre: 'Stage 1' },
    orden: 1,
    pesoMinimo: 10,
    pesoIdeal: 15,
    pesoMaximo: 20,
    cantidadMuestrasRequeridas: 2,
  },
  {
    etapa: { id: 20, nombre: 'Stage 2' },
    orden: 2,
    pesoMinimo: 30,
    pesoIdeal: 35,
    pesoMaximo: 40,
    cantidadMuestrasRequeridas: 1,
  },
];

describe('usePasadaState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('determines the active stage based on samples count', () => {
    const { result } = renderHook(() =>
      usePasadaState({
        pasadaId: 101,
        usuarioId: 3,
        lineaProduccionId: 1,
        etapas: mockEtapas,
        initialMuestras: [],
      })
    );

    // Initial state: Stage 1 is active (no samples)
    expect(result.current.etapaActiva?.etapa.id).toBe(10);
    expect(result.current.muestras.length).toBe(0);
  });

  it('auto-advances to the next stage once stage 1 has enough OK samples', () => {
    // Stage 1 (mockEtapas[0]) requires 2 OK samples.
    const initialMuestras = [
      {
        id: 1,
        pesoNeto: 15,
        estadoValidacion: 'ok' as const,
        usuarioId: 3,
        etapaId: 10,
        lineaProduccionId: 1,
        timestamp: new Date(),
      },
      {
        id: 2,
        pesoNeto: 15,
        estadoValidacion: 'ok' as const,
        usuarioId: 3,
        etapaId: 10,
        lineaProduccionId: 1,
        timestamp: new Date(),
      },
    ];

    const { result } = renderHook(() =>
      usePasadaState({
        pasadaId: 101,
        usuarioId: 3,
        lineaProduccionId: 1,
        etapas: mockEtapas,
        initialMuestras,
      })
    );

    // Stage 1 already satisfied on mount → derived state jumps straight to Stage 2.
    expect(result.current.etapaActiva?.etapa.id).toBe(20);
  });

  it('returns null when every stage already has enough OK samples', () => {
    // Stage 1 needs 2, Stage 2 needs 1.
    const initialMuestras = [
      { id: 1, pesoNeto: 15, estadoValidacion: 'ok' as const, usuarioId: 3, etapaId: 10, lineaProduccionId: 1, timestamp: new Date() },
      { id: 2, pesoNeto: 15, estadoValidacion: 'ok' as const, usuarioId: 3, etapaId: 10, lineaProduccionId: 1, timestamp: new Date() },
      { id: 3, pesoNeto: 35, estadoValidacion: 'ok' as const, usuarioId: 3, etapaId: 20, lineaProduccionId: 1, timestamp: new Date() },
    ];

    const { result } = renderHook(() =>
      usePasadaState({
        pasadaId: 101,
        usuarioId: 3,
        lineaProduccionId: 1,
        etapas: mockEtapas,
        initialMuestras,
      })
    );

    // All stages derived as satisfied, active stage is null.
    expect(result.current.etapaActiva).toBeNull();
  });

  it('registers a sample calling api and updates local list', async () => {
    const mockMuestraResult: Muestra = {
      id: 50,
      pesoNeto: 15,
      estadoValidacion: 'ok',
      usuarioId: 3,
      etapaId: 10,
      lineaProduccionId: 1,
      timestamp: new Date().toISOString(),
    };

    vi.mocked(registrarMuestra).mockResolvedValue(mockMuestraResult);

    const { result } = renderHook(() =>
      usePasadaState({
        pasadaId: 101,
        usuarioId: 3,
        lineaProduccionId: 1,
        etapas: mockEtapas,
        initialMuestras: [],
      })
    );

    let added;
    await act(async () => {
      added = await result.current.addSample(15);
    });

    expect(registrarMuestra).toHaveBeenCalledWith({
      pasadaId: 101,
      etapaId: 10,
      pesoNeto: 15,
      usuarioId: 3,
      lineaProduccionId: 1,
    });

    expect(added).toBeDefined();
    expect(result.current.muestras.length).toBe(1);
    expect(result.current.muestras[0].id).toBe(50);
  });

  it('deletes a sample by calling the API, without optimistically filtering the local list', async () => {
    // Delete is refetch-driven, not optimistic: removeSample only calls the
    // API. The caller (TabletWorkspace) invalidates the muestras query on
    // success, and the subsequent refetch reseeds `initialMuestras`, which
    // is what actually shrinks `muestras`.
    const initialMuestras = [
      {
        id: 100,
        pesoNeto: 15,
        estadoValidacion: 'ok' as const,
        usuarioId: 3,
        etapaId: 10,
        lineaProduccionId: 1,
        timestamp: new Date(),
      },
    ];

    vi.mocked(deleteMuestra).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      usePasadaState({
        pasadaId: 101,
        usuarioId: 3,
        lineaProduccionId: 1,
        etapas: mockEtapas,
        initialMuestras,
      })
    );

    expect(result.current.muestras.length).toBe(1);

    await act(async () => {
      await result.current.removeSample(0);
    });

    expect(deleteMuestra).toHaveBeenCalledWith(100);
    // No optimistic filter: the sample is still present until a refetch reseeds it.
    expect(result.current.muestras.length).toBe(1);
  });

  it('handles api error via onApiError callback', async () => {
    const apiError = new Error('Network error');
    vi.mocked(registrarMuestra).mockRejectedValue(apiError);

    const onErrorMock = vi.fn();

    const { result } = renderHook(() =>
      usePasadaState({
        pasadaId: 101,
        usuarioId: 3,
        lineaProduccionId: 1,
        etapas: mockEtapas,
        initialMuestras: [],
        onApiError: onErrorMock,
      })
    );

    await expect(
      act(async () => {
        await result.current.addSample(15);
      })
    ).rejects.toThrow('Network error');

    expect(onErrorMock).toHaveBeenCalledWith(apiError);
  });

  it('normalizeMuestra correctly handles flat IDs and populated objects for usuario and etapa', () => {
    const { result } = renderHook(() =>
      usePasadaState({
        pasadaId: 101,
        usuarioId: 3,
        lineaProduccionId: 1,
        etapas: mockEtapas,
        initialMuestras: [
          // Case 1: Populated objects
          {
            id: 1,
            pesoNeto: 15,
            estadoValidacion: 'ok',
            usuario: { id: 7, nombre: 'Juan' },
            etapa: { id: 20, nombre: 'Etapa 2' },
            lineaProduccionId: 1,
            timestamp: new Date(),
          } as unknown as Muestra,
          // Case 2: Flat IDs
          {
            id: 2,
            pesoNeto: 15,
            estadoValidacion: 'ok',
            usuario: 8,
            etapa: 10,
            lineaProduccionId: 1,
            timestamp: new Date(),
          } as unknown as Muestra,
        ],
      })
    );

    expect(result.current.muestras[0].usuarioId).toBe(7);
    expect(result.current.muestras[0].etapaId).toBe(20);
    expect(result.current.muestras[1].usuarioId).toBe(8);
    expect(result.current.muestras[1].etapaId).toBe(10);
  });

  describe('etapasConEstado', () => {
    it('Hook returns etapasConEstado field', () => {
      const { result } = renderHook(() =>
        usePasadaState({
          pasadaId: 101,
          usuarioId: 3,
          lineaProduccionId: 1,
          etapas: mockEtapas,
          initialMuestras: [],
        })
      );
      expect(result.current.etapasConEstado).toBeDefined();
    });

    it('3 stages, zero samples -> stage 1 actual, stages 2+3 pendiente', () => {
      const { result } = renderHook(() =>
        usePasadaState({
          pasadaId: 101,
          usuarioId: 3,
          lineaProduccionId: 1,
          etapas: [
            ...mockEtapas,
            {
              etapa: { id: 30, nombre: 'Stage 3' },
              orden: 3,
              pesoMinimo: 50,
              pesoIdeal: 55,
              pesoMaximo: 60,
              cantidadMuestrasRequeridas: 1,
            }
          ],
          initialMuestras: [],
        })
      );

      const estados = result.current.etapasConEstado;
      expect(estados.length).toBe(3);
      expect(estados[0].estado).toBe('actual');
      expect(estados[1].estado).toBe('pendiente');
      expect(estados[2].estado).toBe('pendiente');
    });

    it('stage 1 satisfied by OK count -> stage 1 completada, stage 2 actual', () => {
      const { result } = renderHook(() =>
        usePasadaState({
          pasadaId: 101,
          usuarioId: 3,
          lineaProduccionId: 1,
          etapas: mockEtapas, // Stage 1 requires 2 OK samples
          initialMuestras: [
            { id: 1, pesoNeto: 15, estadoValidacion: 'ok', usuarioId: 3, etapaId: 10, lineaProduccionId: 1, timestamp: new Date() },
            { id: 2, pesoNeto: 15, estadoValidacion: 'ok', usuarioId: 3, etapaId: 10, lineaProduccionId: 1, timestamp: new Date() },
          ],
        })
      );

      const estados = result.current.etapasConEstado;
      expect(estados[0].estado).toBe('completada');
      expect(estados[1].estado).toBe('actual');
    });

    it('all stages satisfied by OK count -> array has all completada, none actual', () => {
      const { result } = renderHook(() =>
        usePasadaState({
          pasadaId: 101,
          usuarioId: 3,
          lineaProduccionId: 1,
          etapas: mockEtapas, // Stage 1 requires 2, Stage 2 requires 1
          initialMuestras: [
            { id: 1, pesoNeto: 15, estadoValidacion: 'ok', usuarioId: 3, etapaId: 10, lineaProduccionId: 1, timestamp: new Date() },
            { id: 2, pesoNeto: 15, estadoValidacion: 'ok', usuarioId: 3, etapaId: 10, lineaProduccionId: 1, timestamp: new Date() },
            { id: 3, pesoNeto: 35, estadoValidacion: 'ok', usuarioId: 3, etapaId: 20, lineaProduccionId: 1, timestamp: new Date() },
          ],
        })
      );

      const estados = result.current.etapasConEstado;
      expect(estados.every(e => e.estado === 'completada')).toBe(true);
      expect(estados.some(e => e.estado === 'actual')).toBe(false);
    });

    it('Stage 1 needs 3, has 3 fuera_de_rango -> stage 1 still actual', () => {
      const { result } = renderHook(() =>
        usePasadaState({
          pasadaId: 101,
          usuarioId: 3,
          lineaProduccionId: 1,
          etapas: [
            {
              etapa: { id: 10, nombre: 'Stage 1' },
              orden: 1,
              pesoMinimo: 10,
              pesoIdeal: 15,
              pesoMaximo: 20,
              cantidadMuestrasRequeridas: 3,
            }
          ],
          initialMuestras: [
            {
              id: 1,
              pesoNeto: 5,
              estadoValidacion: 'fuera_de_rango',
              usuarioId: 3,
              etapaId: 10,
              lineaProduccionId: 1,
              timestamp: new Date(),
            },
            {
              id: 2,
              pesoNeto: 5,
              estadoValidacion: 'fuera_de_rango',
              usuarioId: 3,
              etapaId: 10,
              lineaProduccionId: 1,
              timestamp: new Date(),
            },
            {
              id: 3,
              pesoNeto: 5,
              estadoValidacion: 'fuera_de_rango',
              usuarioId: 3,
              etapaId: 10,
              lineaProduccionId: 1,
              timestamp: new Date(),
            }
          ],
        })
      );

      const estados = result.current.etapasConEstado;
      expect(estados[0].estado).toBe('actual');
    });

    it('Empty etapas prop -> etapasConEstado is empty array, no throw', () => {
      const { result } = renderHook(() =>
        usePasadaState({
          pasadaId: 101,
          usuarioId: 3,
          lineaProduccionId: 1,
          etapas: [],
          initialMuestras: [],
        })
      );

      expect(result.current.etapasConEstado).toEqual([]);
    });
  });

  it('etapaActiva must not advance on fuera_de_rango', () => {
    const { result } = renderHook(() =>
      usePasadaState({
        pasadaId: 101,
        usuarioId: 3,
        lineaProduccionId: 1,
        etapas: mockEtapas, // Stage 1 requires 2 samples
        initialMuestras: [
          {
            id: 1,
            pesoNeto: 5,
            estadoValidacion: 'fuera_de_rango',
            usuarioId: 3,
            etapaId: 10,
            lineaProduccionId: 1,
            timestamp: new Date(),
          },
          {
            id: 2,
            pesoNeto: 5,
            estadoValidacion: 'fuera_de_rango',
            usuarioId: 3,
            etapaId: 10,
            lineaProduccionId: 1,
            timestamp: new Date(),
          }
        ],
      })
    );

    // Should still be in Stage 1 since it requires 2 'ok' samples
    expect(result.current.etapaActiva?.etapa.id).toBe(10);
  });

  // ── updateSample ───────────────────────────────────────────────────────────

  describe('updateSample', () => {
    it('is exposed as a function on the hook result', () => {
      const { result } = renderHook(() =>
        usePasadaState({
          pasadaId: 101,
          usuarioId: 3,
          lineaProduccionId: 1,
          etapas: mockEtapas,
          initialMuestras: [],
        })
      );
      expect(typeof result.current.updateSample).toBe('function');
    });

    it('calls updateMuestra with the sample id and patches muestras[index] on success', async () => {
      const initialMuestras: Muestra[] = [
        {
          id: 100,
          pesoNeto: 15,
          estadoValidacion: 'ok',
          usuarioId: 3,
          etapaId: 10,
          lineaProduccionId: 1,
          timestamp: new Date().toISOString(),
          observacion: '',
        },
      ];
      const updated: Muestra = { ...initialMuestras[0], observacion: 'nota editada' };
      vi.mocked(updateMuestra).mockResolvedValue(updated);

      const { result } = renderHook(() =>
        usePasadaState({
          pasadaId: 101,
          usuarioId: 3,
          lineaProduccionId: 1,
          etapas: mockEtapas,
          initialMuestras,
        })
      );

      await act(async () => {
        await result.current.updateSample(0, { observacion: 'nota editada' });
      });

      expect(updateMuestra).toHaveBeenCalledWith(100, { observacion: 'nota editada' });
      expect(result.current.muestras[0].observacion).toBe('nota editada');
      // Identity changed (new normalized object), length preserved
      expect(result.current.muestras).toHaveLength(1);
    });

    it('leaves muestras unchanged when updateMuestra rejects and propagates to onApiError', async () => {
      const initialMuestras: Muestra[] = [
        {
          id: 100,
          pesoNeto: 15,
          estadoValidacion: 'ok',
          usuarioId: 3,
          etapaId: 10,
          lineaProduccionId: 1,
          timestamp: new Date().toISOString(),
          observacion: 'original',
        },
      ];
      const apiError = new Error('boom');
      vi.mocked(updateMuestra).mockRejectedValue(apiError);
      const onApiError = vi.fn();

      const { result } = renderHook(() =>
        usePasadaState({
          pasadaId: 101,
          usuarioId: 3,
          lineaProduccionId: 1,
          etapas: mockEtapas,
          initialMuestras,
          onApiError,
        })
      );

      await expect(
        act(async () => {
          await result.current.updateSample(0, { observacion: 'nueva' });
        })
      ).rejects.toThrow('boom');

      expect(onApiError).toHaveBeenCalledWith(apiError);
      expect(result.current.muestras[0].observacion).toBe('original');
    });
  });

  describe('derived state re-computation (no client-side pointer)', () => {
    it('switching pasadaId re-derives the active stage from the newly loaded muestras, not from the previous pasada', () => {
      const pasada101Muestras = [
        { id: 1, pesoNeto: 15, estadoValidacion: 'ok' as const, usuarioId: 3, etapaId: 10, lineaProduccionId: 1, timestamp: new Date() },
        { id: 2, pesoNeto: 15, estadoValidacion: 'ok' as const, usuarioId: 3, etapaId: 10, lineaProduccionId: 1, timestamp: new Date() },
        { id: 3, pesoNeto: 35, estadoValidacion: 'ok' as const, usuarioId: 3, etapaId: 20, lineaProduccionId: 1, timestamp: new Date() },
      ];

      const { result, rerender } = renderHook(
        ({ pasadaId, samples }) =>
          usePasadaState({
            pasadaId,
            usuarioId: 3,
            lineaProduccionId: 1,
            etapas: mockEtapas,
            initialMuestras: samples,
          }),
        { initialProps: { pasadaId: 101, samples: pasada101Muestras } }
      );

      // Pasada 101: every stage satisfied → no active stage
      expect(result.current.etapaActiva).toBeNull();

      // Switch to a fresh pasada with zero muestras — no imperative pointer
      // to reset, the derivation just recomputes from the new prop.
      rerender({ pasadaId: 102, samples: [] });

      expect(result.current.etapaActiva?.etapa.id).toBe(10);
    });

    it('a satisfied-count auto-advance happens purely from muestras, without any manual-advance call', () => {
      const { result, rerender } = renderHook(
        ({ samples }) =>
          usePasadaState({
            pasadaId: 101,
            usuarioId: 3,
            lineaProduccionId: 1,
            etapas: mockEtapas,
            initialMuestras: samples,
          }),
        { initialProps: { samples: [] as Muestra[] } }
      );

      expect(result.current.etapaActiva?.etapa.id).toBe(10);

      rerender({
        samples: [
          { id: 1, pesoNeto: 15, estadoValidacion: 'ok', usuarioId: 3, etapaId: 10, lineaProduccionId: 1, timestamp: new Date() },
          { id: 2, pesoNeto: 15, estadoValidacion: 'ok', usuarioId: 3, etapaId: 10, lineaProduccionId: 1, timestamp: new Date() },
        ] as unknown as Muestra[],
      });

      expect(result.current.etapaActiva?.etapa.id).toBe(20);
    });

    it('deleting a sample that drops a completed stage below its requirement regresses the active stage after the caller reseeds muestras', async () => {
      // Stage 1 (requires 2) starts satisfied with 2 OK samples, Stage 2 is active.
      const initialMuestras = [
        { id: 1, pesoNeto: 15, estadoValidacion: 'ok' as const, usuarioId: 3, etapaId: 10, lineaProduccionId: 1, timestamp: new Date() },
        { id: 2, pesoNeto: 15, estadoValidacion: 'ok' as const, usuarioId: 3, etapaId: 10, lineaProduccionId: 1, timestamp: new Date() },
      ];
      vi.mocked(deleteMuestra).mockResolvedValue(undefined);

      const { result, rerender } = renderHook(
        ({ samples }) =>
          usePasadaState({
            pasadaId: 101,
            usuarioId: 3,
            lineaProduccionId: 1,
            etapas: mockEtapas,
            initialMuestras: samples,
          }),
        { initialProps: { samples: initialMuestras } }
      );

      expect(result.current.etapaActiva?.etapa.id).toBe(20);

      // Delete one of Stage 1's OK samples via the hook's removeSample
      // (no optimistic local filter — muestras stays server-driven).
      await act(async () => {
        await result.current.removeSample(0);
      });
      expect(deleteMuestra).toHaveBeenCalledWith(1);

      // The caller (TabletWorkspace) invalidates + refetches on delete success;
      // simulate that refetch reseeding initialMuestras with the sample gone.
      rerender({ samples: [initialMuestras[1]] });

      // Stage 1 falls back below its requirement → silently regresses to actual.
      expect(result.current.etapaActiva?.etapa.id).toBe(10);
    });
  });
});
