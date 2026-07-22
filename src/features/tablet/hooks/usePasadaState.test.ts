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
  const store: Record<string, string> = {};
  
  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
        clear: vi.fn(() => { for (const key in store) delete store[key]; }),
      },
      writable: true
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
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

  it('advances to the next stage when finalizarEtapaActual is called', () => {
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
    ];

    const { result } = renderHook(
      ({ samples }) =>
        usePasadaState({
          pasadaId: 101,
          usuarioId: 3,
          lineaProduccionId: 1,
          etapas: mockEtapas,
          initialMuestras: samples,
        }),
      {
        initialProps: { samples: initialMuestras },
      }
    );

    // Initial state: Stage 1 is active
    expect(result.current.etapaActiva?.etapa.id).toBe(10);

    // Call manual advance
    act(() => {
      result.current.finalizarEtapaActual();
    });

    // Now Stage 1 is complete, it should advance to Stage 2
    expect(result.current.etapaActiva?.etapa.id).toBe(20);
  });

  it('returns null when all stages are completed', () => {
    const { result } = renderHook(() =>
      usePasadaState({
        pasadaId: 101,
        usuarioId: 3,
        lineaProduccionId: 1,
        etapas: mockEtapas,
        initialMuestras: [],
      })
    );

    act(() => {
      result.current.finalizarEtapaActual(); // complete stage 1
    });
    
    act(() => {
      result.current.finalizarEtapaActual(); // complete stage 2
    });

    // All stages manually completed, active stage is null
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
      articuloId: undefined,
    });

    expect(added).toBeDefined();
    expect(result.current.muestras.length).toBe(1);
    expect(result.current.muestras[0].id).toBe(50);
  });

  it('deletes a sample calling api and updates local list', async () => {
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
    expect(result.current.muestras.length).toBe(0);
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

    it('Stage 1 manually completed -> stage 1 completada, stage 2 actual', () => {
      const { result } = renderHook(() =>
        usePasadaState({
          pasadaId: 101,
          usuarioId: 3,
          lineaProduccionId: 1,
          etapas: mockEtapas,
          initialMuestras: [],
        })
      );

      act(() => {
        result.current.finalizarEtapaActual();
      });

      const estados = result.current.etapasConEstado;
      expect(estados[0].estado).toBe('completada');
      expect(estados[1].estado).toBe('actual');
    });

    it('All stages manually complete -> array has all completada, none actual', () => {
      const { result } = renderHook(() =>
        usePasadaState({
          pasadaId: 101,
          usuarioId: 3,
          lineaProduccionId: 1,
          etapas: mockEtapas,
          initialMuestras: [],
        })
      );

      act(() => {
        result.current.finalizarEtapaActual();
      });
      act(() => {
        result.current.finalizarEtapaActual();
      });

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

  describe('completedEtapaIds reset on pasadaId change', () => {
    it('resets to empty when switching to a new pasada with no completed stages', () => {
      // Simulate localStorage: pasada 101 has completed stages
      store['pasada_101_completed'] = JSON.stringify([10, 20]);

      const { result, rerender } = renderHook(
        ({ pasadaId }) =>
          usePasadaState({
            pasadaId,
            usuarioId: 3,
            lineaProduccionId: 1,
            etapas: mockEtapas,
            initialMuestras: [],
          }),
        { initialProps: { pasadaId: 101 } }
      );

      // Pasada 101: both stages completed → no active stage
      expect(result.current.etapaActiva).toBeNull();

      // Switch to pasada 102 — no completed stages in localStorage
      rerender({ pasadaId: 102 });

      // Should reset: first stage becomes active
      expect(result.current.etapaActiva?.etapa.id).toBe(10);
    });

    it('loads completed stages from localStorage when switching to a pasada that has them', () => {
      store['pasada_201_completed'] = JSON.stringify([10]);

      const { result, rerender } = renderHook(
        ({ pasadaId }) =>
          usePasadaState({
            pasadaId,
            usuarioId: 3,
            lineaProduccionId: 1,
            etapas: mockEtapas,
            initialMuestras: [],
          }),
        { initialProps: { pasadaId: 200 } }
      );

      // Pasada 200: no completed stages → first stage active
      expect(result.current.etapaActiva?.etapa.id).toBe(10);

      // Switch to pasada 201 that has stage 10 already completed
      rerender({ pasadaId: 201 });

      // Stage 1 completed → stage 2 should be active
      expect(result.current.etapaActiva?.etapa.id).toBe(20);
    });

    it('clears completedEtapaIds when pasadaId becomes null', () => {
      store['pasada_301_completed'] = JSON.stringify([10]);

      const { result, rerender } = renderHook(
        ({ pasadaId }: { pasadaId: number | null }) =>
          usePasadaState({
            pasadaId,
            usuarioId: 3,
            lineaProduccionId: 1,
            etapas: mockEtapas,
            initialMuestras: [],
          }),
        { initialProps: { pasadaId: 301 } }
      );

      // Stage 1 completed → stage 2 active
      expect(result.current.etapaActiva?.etapa.id).toBe(20);

      // Clear pasada (e.g., navigating away)
      rerender({ pasadaId: null });

      // completedEtapaIds should be empty — no pasada means no progress persisted
      // etapaActiva resets to first stage since there's no completion data
      expect(result.current.etapaActiva?.etapa.id).toBe(10);
    });
  });
});
