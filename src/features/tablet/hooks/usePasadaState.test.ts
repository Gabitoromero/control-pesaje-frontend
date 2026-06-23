import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePasadaState } from './usePasadaState';
import { registrarMuestra, deleteMuestra } from '../../../api/muestras';
import type { RutaPasadaEtapa } from '../../../shared/types/domain';

vi.mock('../../../api/muestras', () => ({
  registrarMuestra: vi.fn(),
  deleteMuestra: vi.fn(),
}));

const mockEtapas: RutaPasadaEtapa[] = [
  {
    etapaId: 10,
    nombre: 'Stage 1',
    pesoMinimo: 10,
    pesoIdeal: 15,
    pesoMaximo: 20,
    cantidadMuestrasRequeridas: 2,
  },
  {
    etapaId: 20,
    nombre: 'Stage 2',
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
    expect(result.current.etapaActiva?.etapaId).toBe(10);
    expect(result.current.muestras.length).toBe(0);
  });

  it('advances to the next stage when required samples are satisfied', () => {
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

    const { result, rerender } = renderHook(
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

    // Still in Stage 1 since it requires 2 samples, only has 1
    expect(result.current.etapaActiva?.etapaId).toBe(10);

    // Add another sample for Stage 1
    const samples2 = [
      ...initialMuestras,
      {
        id: 2,
        pesoNeto: 16,
        estadoValidacion: 'ok' as const,
        usuarioId: 3,
        etapaId: 10,
        lineaProduccionId: 1,
        timestamp: new Date(),
      },
    ];

    rerender({ samples: samples2 });

    // Now Stage 1 has 2 samples, it should advance to Stage 2
    expect(result.current.etapaActiva?.etapaId).toBe(20);
  });

  it('returns null when all stages are completed', () => {
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
        pesoNeto: 16,
        estadoValidacion: 'ok' as const,
        usuarioId: 3,
        etapaId: 10,
        lineaProduccionId: 1,
        timestamp: new Date(),
      },
      {
        id: 3,
        pesoNeto: 35,
        estadoValidacion: 'ok' as const,
        usuarioId: 3,
        etapaId: 20,
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

    // All requirements met, active stage is null
    expect(result.current.etapaActiva).toBeNull();
  });

  it('registers a sample calling api and updates local list', async () => {
    const mockMuestraResult = {
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

    vi.mocked(deleteMuestra).mockResolvedValue(undefined as any);

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
});
