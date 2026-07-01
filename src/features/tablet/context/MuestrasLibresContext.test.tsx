import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MuestrasLibresProvider, useMuestrasLibresContext } from './MuestrasLibresContext';
import type { RutaPasadaEtapa } from '../../../shared/types/domain';
import { registrarMuestra } from '../../../api/muestras';

vi.mock('../../../api/muestras', () => ({
  registrarMuestra: vi.fn(),
  deleteMuestra: vi.fn(),
}));

const mockEtapas: RutaPasadaEtapa[] = [
  {
    etapa: { id: 10, nombre: 'Entrada' },
    orden: 1,
    pesoMinimo: 10,
    pesoIdeal: 15,
    pesoMaximo: 20,
    cantidadMuestrasRequeridas: 2,
  },
  {
    etapa: { id: 20, nombre: 'Salida' },
    orden: 2,
    pesoMinimo: 30,
    pesoIdeal: 35,
    pesoMaximo: 40,
    cantidadMuestrasRequeridas: 1,
  },
];

const mockMuestra = {
  id: 50,
  pesoNeto: 15,
  estadoValidacion: 'ok' as const,
  usuarioId: 3,
  etapaId: 10,
  lineaProduccionId: 1,
  timestamp: new Date().toISOString(),
};

const defaultProviderProps = {
  lineaProduccionId: 1,
  usuarioId: 3,
  etapas: mockEtapas,
};

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MuestrasLibresProvider {...defaultProviderProps}>
      {children}
    </MuestrasLibresProvider>
  );
}

describe('MuestrasLibresContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── T1: outside provider guard ────────────────────────────────────────────────

  it('throws when useMuestrasLibresContext is used outside the provider', () => {
    // Suppress expected error output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useMuestrasLibresContext());
    }).toThrow();
    spy.mockRestore();
  });

  // ── T2: provider renders children ────────────────────────────────────────────

  it('renders children without crashing', () => {
    render(
      <MuestrasLibresProvider {...defaultProviderProps}>
        <span>child content</span>
      </MuestrasLibresProvider>
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  // ── T3: initial muestras is empty ────────────────────────────────────────────

  it('muestras is initially empty', () => {
    const { result } = renderHook(() => useMuestrasLibresContext(), {
      wrapper: TestWrapper,
    });
    expect(result.current.muestras).toHaveLength(0);
  });

  // ── T4: selectedEtapaId defaults to first etapa by orden ─────────────────────

  it('selectedEtapaId defaults to the first etapa sorted by orden', () => {
    // mockEtapas has orden 1 → id 10, orden 2 → id 20 → default should be 10
    const { result } = renderHook(() => useMuestrasLibresContext(), {
      wrapper: TestWrapper,
    });
    expect(result.current.selectedEtapaId).toBe(10);
  });

  // ── T5: addSample is accessible and calls the underlying hook ────────────────

  it('addSample is a function accessible via context', async () => {
    vi.mocked(registrarMuestra).mockResolvedValue(mockMuestra);
    const { result } = renderHook(() => useMuestrasLibresContext(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.addSample(15);
    });

    expect(registrarMuestra).toHaveBeenCalledWith({
      etapaId: 10,
      pesoNeto: 15,
      usuarioId: 3,
      lineaProduccionId: 1,
    });
    expect(result.current.muestras).toHaveLength(1);
  });

  // ── T6: clearSession resets muestras ─────────────────────────────────────────

  it('clearSession resets muestras to []', async () => {
    vi.mocked(registrarMuestra).mockResolvedValue(mockMuestra);
    const { result } = renderHook(() => useMuestrasLibresContext(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.addSample(15);
    });
    expect(result.current.muestras).toHaveLength(1);

    act(() => {
      result.current.clearSession();
    });
    expect(result.current.muestras).toHaveLength(0);
  });
});
