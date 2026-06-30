import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMuestrasLibres } from './useMuestrasLibres';
import { registrarMuestra, deleteMuestra } from '../../../api/muestras';
import type { RutaPasadaEtapa } from '../../../shared/types/domain';

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

const baseProps = {
  lineaProduccionId: 1,
  usuarioId: 3,
  etapas: mockEtapas,
};

const mockMuestra = {
  id: 50,
  pesoNeto: 15,
  estadoValidacion: 'ok' as const,
  usuarioId: 3,
  etapaId: 10,
  lineaProduccionId: 1,
  timestamp: new Date().toISOString(),
};

describe('useMuestrasLibres', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── T4: core ──────────────────────────────────────────────────────────────

  it('defaults selectedEtapaId to the first etapa sorted by orden', () => {
    const { result } = renderHook(() => useMuestrasLibres(baseProps));
    expect(result.current.selectedEtapaId).toBe(10);
  });

  it('setSelectedEtapaId updates selectedEtapaId', () => {
    const { result } = renderHook(() => useMuestrasLibres(baseProps));
    act(() => {
      result.current.setSelectedEtapaId(20);
    });
    expect(result.current.selectedEtapaId).toBe(20);
  });

  it('addSample calls registrarMuestra WITHOUT pasadaId', async () => {
    vi.mocked(registrarMuestra).mockResolvedValue(mockMuestra as any);
    const { result } = renderHook(() => useMuestrasLibres(baseProps));

    await act(async () => {
      await result.current.addSample(15);
    });

    expect(registrarMuestra).toHaveBeenCalledWith({
      etapaId: 10,
      pesoNeto: 15,
      usuarioId: 3,
      lineaProduccionId: 1,
    });
    expect(registrarMuestra).not.toHaveBeenCalledWith(
      expect.objectContaining({ pasadaId: expect.anything() })
    );
  });

  it('addSample normalizes the response and prepends it to muestras', async () => {
    vi.mocked(registrarMuestra).mockResolvedValue(mockMuestra as any);
    const { result } = renderHook(() => useMuestrasLibres(baseProps));

    await act(async () => {
      await result.current.addSample(15);
    });

    expect(result.current.muestras).toHaveLength(1);
    expect(result.current.muestras[0].id).toBe(50);
  });

  it('addSample prepends: second call lands at index 0', async () => {
    const first = { ...mockMuestra, id: 1 };
    const second = { ...mockMuestra, id: 2 };
    vi.mocked(registrarMuestra)
      .mockResolvedValueOnce(first as any)
      .mockResolvedValueOnce(second as any);

    const { result } = renderHook(() => useMuestrasLibres(baseProps));

    await act(async () => { await result.current.addSample(15); });
    await act(async () => { await result.current.addSample(15); });

    expect(result.current.muestras[0].id).toBe(2);
    expect(result.current.muestras[1].id).toBe(1);
  });

  it('addSample respects cap of 20: does not call API when list is full', async () => {
    vi.mocked(registrarMuestra).mockResolvedValue(mockMuestra as any);
    const { result } = renderHook(() => useMuestrasLibres(baseProps));

    // Fill to cap
    for (let i = 0; i < 20; i++) {
      await act(async () => { await result.current.addSample(15); });
    }

    const callsBefore = vi.mocked(registrarMuestra).mock.calls.length;
    expect(callsBefore).toBe(20);
    expect(result.current.muestras).toHaveLength(20);

    let returnVal: any = 'sentinel';
    await act(async () => {
      returnVal = await result.current.addSample(15);
    });

    expect(vi.mocked(registrarMuestra).mock.calls.length).toBe(20); // no new call
    expect(returnVal).toBeUndefined();
    expect(result.current.muestras).toHaveLength(20);
  });

  it('clearSession resets muestras to [] without additional API calls', async () => {
    vi.mocked(registrarMuestra).mockResolvedValue(mockMuestra as any);
    const { result } = renderHook(() => useMuestrasLibres(baseProps));

    await act(async () => { await result.current.addSample(15); });
    expect(result.current.muestras).toHaveLength(1);

    act(() => { result.current.clearSession(); });

    expect(result.current.muestras).toHaveLength(0);
    expect(vi.mocked(registrarMuestra).mock.calls.length).toBe(1); // only the initial addSample
  });

  it('addSample returns early without calling API when selectedEtapaId is null', async () => {
    const { result } = renderHook(() =>
      useMuestrasLibres({ ...baseProps, etapas: [] })
    );

    expect(result.current.selectedEtapaId).toBeNull();

    let returnVal: any = 'sentinel';
    await act(async () => {
      returnVal = await result.current.addSample(15);
    });

    expect(registrarMuestra).not.toHaveBeenCalled();
    expect(returnVal).toBeUndefined();
  });

  // ── T5: removeSample + error path ─────────────────────────────────────────

  it('removeSample calls deleteMuestra and removes the entry from state', async () => {
    vi.mocked(registrarMuestra)
      .mockResolvedValueOnce({ ...mockMuestra, id: 1 } as any)
      .mockResolvedValueOnce({ ...mockMuestra, id: 2 } as any);
    vi.mocked(deleteMuestra).mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useMuestrasLibres(baseProps));

    await act(async () => { await result.current.addSample(15); });
    await act(async () => { await result.current.addSample(15); });

    // After two prepend calls: [id:2, id:1]
    expect(result.current.muestras[0].id).toBe(2);
    expect(result.current.muestras[1].id).toBe(1);

    await act(async () => {
      await result.current.removeSample(0); // removes id:2
    });

    expect(deleteMuestra).toHaveBeenCalledWith(2);
    expect(result.current.muestras).toHaveLength(1);
    expect(result.current.muestras[0].id).toBe(1);
  });

  it('addSample API error calls onApiError and leaves muestras unchanged', async () => {
    const apiError = new Error('Server error');
    vi.mocked(registrarMuestra).mockRejectedValue(apiError);
    const onApiError = vi.fn();

    const { result } = renderHook(() =>
      useMuestrasLibres({ ...baseProps, onApiError })
    );

    await act(async () => {
      await result.current.addSample(15);
    });

    expect(onApiError).toHaveBeenCalledWith(apiError);
    expect(result.current.muestras).toHaveLength(0);
    expect(result.current.isRegistering).toBe(false);
  });

  // ── T6: removeSample stale-closure fix ────────────────────────────────────
  // The hook MUST expose a stable `removeSample` callback that reads the latest
  // `muestras` state via a ref mirror instead of capturing `muestras` in its
  // closure. A consumer that holds onto a captured `removeSample` reference and
  // fires two deletes must hit the CURRENT index 0 each time — never re-delete a
  // sample that was already removed (stale closure / index shift bug).

  it('removeSample rapid successive deletes hit the current index 0 (no stale closure)', async () => {
    const s1 = { ...mockMuestra, id: 1 };
    const s2 = { ...mockMuestra, id: 2 };
    const s3 = { ...mockMuestra, id: 3 };
    vi.mocked(registrarMuestra)
      .mockResolvedValueOnce(s1 as any)
      .mockResolvedValueOnce(s2 as any)
      .mockResolvedValueOnce(s3 as any);
    vi.mocked(deleteMuestra).mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useMuestrasLibres(baseProps));

    await act(async () => { await result.current.addSample(15); });
    await act(async () => { await result.current.addSample(15); });
    await act(async () => { await result.current.addSample(15); });

    // Prepend order: newest first → [s3, s2, s1]
    expect(result.current.muestras.map((m) => m.id)).toEqual([3, 2, 1]);

    // Capture a stable callback reference. Simulates a handler that saved
    // `removeSample` and fired two deletes without re-reading `result.current`
    // between them. With a stale-closure bug, the second call would re-delete
    // the id that was already removed, skipping the newly-exposed index 0.
    const remove = result.current.removeSample;

    await act(async () => { await remove(0); });
    await act(async () => { await remove(0); });

    // Each DELETE call must target the CURRENT index 0 (no duplicate, no skip).
    expect(vi.mocked(deleteMuestra)).toHaveBeenNthCalledWith(1, 3);
    expect(vi.mocked(deleteMuestra)).toHaveBeenNthCalledWith(2, 2);
    expect(result.current.muestras).toHaveLength(1);
    expect(result.current.muestras[0].id).toBe(1);
  });

  it('isRegistering is false after a successful addSample', async () => {
    vi.mocked(registrarMuestra).mockResolvedValue(mockMuestra as any);
    const { result } = renderHook(() => useMuestrasLibres(baseProps));

    await act(async () => {
      await result.current.addSample(15);
    });

    expect(result.current.isRegistering).toBe(false);
  });
});
