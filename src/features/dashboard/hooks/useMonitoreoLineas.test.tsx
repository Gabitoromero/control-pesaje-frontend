import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMonitoreoLineas } from './useMonitoreoLineas';
import {
  getDashboardLineas,
  getDashboardResumen,
  getDashboardKpis,
  getDashboardEtapas,
} from '../../../api/dashboard';

vi.mock('../../../api/dashboard', () => ({
  getDashboardLineas: vi.fn(),
  getDashboardResumen: vi.fn(),
  getDashboardKpis: vi.fn(),
  getDashboardEtapas: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const resumenEsperando = { conectado: false, pasadaEnCurso: null };
const kpisVacios = { muestrasTotales: 0, fueraRango: 0, pasadasFinalizadas: 0, pasadasEnCurso: 0 };

describe('useMonitoreoLineas', () => {
  beforeEach(() => {
    vi.mocked(getDashboardResumen).mockResolvedValue(resumenEsperando as any);
    vi.mocked(getDashboardKpis).mockResolvedValue(kpisVacios as any);
    vi.mocked(getDashboardEtapas).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('filters out líneas without rutaPasadaActiva', async () => {
    vi.mocked(getDashboardLineas).mockResolvedValue([
      { id: 1, nombre: 'Linea 1', activo: true, rutaPasadaActiva: { id: 10, nombre: 'Ruta A' } },
      { id: 2, nombre: 'Linea 2', activo: true },
    ] as any);

    const { result } = renderHook(() => useMonitoreoLineas(), { wrapper });

    await waitFor(() => expect(result.current.lineas).toHaveLength(1));
    expect(result.current.lineas[0].id).toBe(1);
  });

  it('reports isEmpty true when no línea has rutaPasadaActiva', async () => {
    vi.mocked(getDashboardLineas).mockResolvedValue([
      { id: 1, nombre: 'Linea 1', activo: true },
      { id: 2, nombre: 'Linea 2', activo: true },
    ] as any);

    const { result } = renderHook(() => useMonitoreoLineas(), { wrapper });

    await waitFor(() => expect(result.current.isEmpty).toBe(true));
  });

  it('does not filter out a línea with ruta activa but sin dispositivo', async () => {
    vi.mocked(getDashboardLineas).mockResolvedValue([
      {
        id: 1,
        nombre: 'Linea 1',
        activo: true,
        rutaPasadaActiva: { id: 10, nombre: 'Ruta A' },
        dispositivo: null,
      },
    ] as any);

    const { result } = renderHook(() => useMonitoreoLineas(), { wrapper });

    await waitFor(() => expect(result.current.lineas).toHaveLength(1));
    expect(result.current.isEmpty).toBe(false);
    expect(result.current.lineas[0].dispositivo).toBeNull();
  });

  it('does not break when resumen payload is "esperando" (pasadaEnCurso: null)', async () => {
    vi.mocked(getDashboardLineas).mockResolvedValue([
      { id: 1, nombre: 'Linea 1', activo: true, rutaPasadaActiva: { id: 10, nombre: 'Ruta A' } },
    ] as any);

    const { result } = renderHook(() => useMonitoreoLineas(), { wrapper });

    await waitFor(() => expect(result.current.resumen).toBeDefined());
    expect(result.current.resumen?.pasadaEnCurso).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('rotates lineaIndex every 60s among filtered líneas', async () => {
    vi.useFakeTimers();
    vi.mocked(getDashboardLineas).mockResolvedValue([
      { id: 1, nombre: 'Linea 1', activo: true, rutaPasadaActiva: { id: 10, nombre: 'Ruta A' } },
      { id: 2, nombre: 'Linea 2', activo: true, rutaPasadaActiva: { id: 20, nombre: 'Ruta B' } },
    ] as any);

    const { result } = renderHook(() => useMonitoreoLineas(), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.lineas).toHaveLength(2);
    expect(result.current.lineaIndex).toBe(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000);
    });

    expect(result.current.lineaIndex).toBe(1);
  });
});
