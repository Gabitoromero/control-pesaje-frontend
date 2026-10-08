import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getPasadas } from '../../../api/pasadas';
import { getSesionesActivas } from '../../../api/auth';
import type { Pasada } from '../../../shared/types/index';
import type { SesionActivaAdmin } from '../../../shared/types/auth';

vi.mock('../../../api/pasadas', () => ({ getPasadas: vi.fn() }));
vi.mock('../../../api/auth', () => ({ getSesionesActivas: vi.fn() }));

// src/test/setup.ts globally mocks this hook; load the real implementation.
const { useActividadGlobal } = await vi.importActual<typeof import('./useActividadGlobal')>(
  './useActividadGlobal',
);

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

const sesion = (lineaId: number) => ({
  lineaId,
  lineaNombre: `L${lineaId}`,
  usuarioId: 5,
  fechaInicio: '2026-01-01T00:00:00.000Z',
  expiraEn: null,
});

async function renderLoaded() {
  const hook = renderHook(() => useActividadGlobal(), { wrapper });
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}

describe('useActividadGlobal - lineaIdsConActividad', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('includes the line id of a pasada with a nested lineaProduccion', async () => {
    vi.mocked(getPasadas).mockResolvedValue([
      { id: 10, estado: 'en_curso', lineaProduccion: { id: 1, nombre: 'L1' } },
    ] as unknown as Pasada[]);
    vi.mocked(getSesionesActivas).mockResolvedValue([]);

    const { result } = await renderLoaded();

    expect(result.current.lineaIdsConActividad.has(1)).toBe(true);
    expect(result.current.hayActividad).toBe(true);
  });

  it('falls back to the flat lineaProduccionId', async () => {
    vi.mocked(getPasadas).mockResolvedValue([
      { id: 11, estado: 'en_curso', lineaProduccionId: 2 },
    ] as unknown as Pasada[]);
    vi.mocked(getSesionesActivas).mockResolvedValue([]);

    const { result } = await renderLoaded();

    expect(result.current.lineaIdsConActividad.has(2)).toBe(true);
  });

  it('includes the line id of an active session', async () => {
    vi.mocked(getPasadas).mockResolvedValue([]);
    vi.mocked(getSesionesActivas).mockResolvedValue([sesion(3)] as unknown as SesionActivaAdmin[]);

    const { result } = await renderLoaded();

    expect(result.current.lineaIdsConActividad.has(3)).toBe(true);
    expect(result.current.hayActividad).toBe(true);
  });

  it('ignores a pasada without line info but keeps hayActividad true', async () => {
    vi.mocked(getPasadas).mockResolvedValue([{ id: 12, estado: 'en_curso' }] as unknown as Pasada[]);
    vi.mocked(getSesionesActivas).mockResolvedValue([]);

    const { result } = await renderLoaded();

    expect(result.current.lineaIdsConActividad.size).toBe(0);
    expect(result.current.hayActividad).toBe(true);
  });

  it('returns an empty set and hayActividad false when there is no activity', async () => {
    vi.mocked(getPasadas).mockResolvedValue([]);
    vi.mocked(getSesionesActivas).mockResolvedValue([]);

    const { result } = await renderLoaded();

    expect(result.current.lineaIdsConActividad.size).toBe(0);
    expect(result.current.hayActividad).toBe(false);
  });

  it('dedupes a line present in both a pasada and a session', async () => {
    vi.mocked(getPasadas).mockResolvedValue([
      { id: 13, estado: 'en_curso', lineaProduccion: { id: 4 } },
    ] as unknown as Pasada[]);
    vi.mocked(getSesionesActivas).mockResolvedValue([sesion(4)] as unknown as SesionActivaAdmin[]);

    const { result } = await renderLoaded();

    expect(result.current.lineaIdsConActividad.size).toBe(1);
  });
});
