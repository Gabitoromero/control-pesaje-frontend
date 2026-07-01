import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMuestrasLibres } from './useMuestrasLibres';
import { registrarMuestra, deleteMuestra, updateMuestra } from '../../../api/muestras';
import type { Muestra, RutaPasadaEtapa } from '../../../shared/types/domain';

vi.mock('../../../api/muestras', () => ({
  registrarMuestra: vi.fn(),
  deleteMuestra: vi.fn(),
  updateMuestra: vi.fn(),
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
    vi.mocked(registrarMuestra).mockResolvedValue(mockMuestra as Muestra);
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

  it('addSample normalizes the response and appends it to muestras', async () => {
    vi.mocked(registrarMuestra).mockResolvedValue(mockMuestra as Muestra);
    const { result } = renderHook(() => useMuestrasLibres(baseProps));

    await act(async () => {
      await result.current.addSample(15);
    });

    expect(result.current.muestras).toHaveLength(1);
    expect(result.current.muestras[0].id).toBe(50);
  });

  it('addSample appends: first added lands at index 0, second at index 1', async () => {
    const first = { ...mockMuestra, id: 1 };
    const second = { ...mockMuestra, id: 2 };
    vi.mocked(registrarMuestra)
      .mockResolvedValueOnce(first as Muestra)
      .mockResolvedValueOnce(second as Muestra);

    const { result } = renderHook(() => useMuestrasLibres(baseProps));

    await act(async () => { await result.current.addSample(15); });
    await act(async () => { await result.current.addSample(15); });

    expect(result.current.muestras[0].id).toBe(1);
    expect(result.current.muestras[1].id).toBe(2);
  });

  it('addSample respects cap of 20: does not call API when list is full', async () => {
    vi.mocked(registrarMuestra).mockResolvedValue(mockMuestra as Muestra);
    const { result } = renderHook(() => useMuestrasLibres(baseProps));

    // Fill to cap
    for (let i = 0; i < 20; i++) {
      await act(async () => { await result.current.addSample(15); });
    }

    const callsBefore = vi.mocked(registrarMuestra).mock.calls.length;
    expect(callsBefore).toBe(20);
    expect(result.current.muestras).toHaveLength(20);

    let returnVal: Muestra | undefined;
    await act(async () => {
      returnVal = await result.current.addSample(15);
    });

    expect(vi.mocked(registrarMuestra).mock.calls.length).toBe(20); // no new call
    expect(returnVal).toBeUndefined();
    expect(result.current.muestras).toHaveLength(20);
  });

  it('clearSession resets muestras to [] without additional API calls', async () => {
    vi.mocked(registrarMuestra).mockResolvedValue(mockMuestra as Muestra);
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

    let returnVal: Muestra | undefined;
    await act(async () => {
      returnVal = await result.current.addSample(15);
    });

    expect(registrarMuestra).not.toHaveBeenCalled();
    expect(returnVal).toBeUndefined();
  });

  // ── T5: removeSample + error path ─────────────────────────────────────────

  it('removeSample calls deleteMuestra and removes the entry from state', async () => {
    vi.mocked(registrarMuestra)
      .mockResolvedValueOnce({ ...mockMuestra, id: 1 } as Muestra)
      .mockResolvedValueOnce({ ...mockMuestra, id: 2 } as Muestra);
    vi.mocked(deleteMuestra).mockResolvedValue(undefined);

    const { result } = renderHook(() => useMuestrasLibres(baseProps));

    await act(async () => { await result.current.addSample(15); });
    await act(async () => { await result.current.addSample(15); });

    // After two append calls: [id:1, id:2]
    expect(result.current.muestras[0].id).toBe(1);
    expect(result.current.muestras[1].id).toBe(2);

    await act(async () => {
      await result.current.removeSample(0); // removes id:1
    });

    expect(deleteMuestra).toHaveBeenCalledWith(1);
    expect(result.current.muestras).toHaveLength(1);
    expect(result.current.muestras[0].id).toBe(2);
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
      .mockResolvedValueOnce(s1 as Muestra)
      .mockResolvedValueOnce(s2 as Muestra)
      .mockResolvedValueOnce(s3 as Muestra);
    vi.mocked(deleteMuestra).mockResolvedValue(undefined);

    const { result } = renderHook(() => useMuestrasLibres(baseProps));

    await act(async () => { await result.current.addSample(15); });
    await act(async () => { await result.current.addSample(15); });
    await act(async () => { await result.current.addSample(15); });

    // Append order: oldest first → [s1, s2, s3]
    expect(result.current.muestras.map((m) => m.id)).toEqual([1, 2, 3]);

    // Capture a stable callback reference. Simulates a handler that saved
    // `removeSample` and fired two deletes without re-reading `result.current`
    // between them. With a stale-closure bug, the second call would re-delete
    // the id that was already removed, skipping the newly-exposed index 0.
    const remove = result.current.removeSample;

    await act(async () => { await remove(0); });
    await act(async () => { await remove(0); });

    // Each DELETE call must target the CURRENT index 0 (no duplicate, no skip).
    expect(vi.mocked(deleteMuestra)).toHaveBeenNthCalledWith(1, 1);
    expect(vi.mocked(deleteMuestra)).toHaveBeenNthCalledWith(2, 2);
    expect(result.current.muestras).toHaveLength(1);
    expect(result.current.muestras[0].id).toBe(3);
  });

  it('isRegistering is false after a successful addSample', async () => {
    vi.mocked(registrarMuestra).mockResolvedValue(mockMuestra as Muestra);
    const { result } = renderHook(() => useMuestrasLibres(baseProps));

    await act(async () => {
      await result.current.addSample(15);
    });

    expect(result.current.isRegistering).toBe(false);
  });

  // ── T7: updateSample ──────────────────────────────────────────────────────

  describe('updateSample', () => {
    it('is exposed as a function on the hook result', () => {
      const { result } = renderHook(() => useMuestrasLibres(baseProps));
      expect(typeof result.current.updateSample).toBe('function');
    });

    it('calls updateMuestra with the sample id and patches muestras[index] on success', async () => {
      const initial: Muestra = { ...mockMuestra, id: 100, observacion: '' } as Muestra;
      const updated: Muestra = { ...initial, observacion: 'nota editada' };
      vi.mocked(registrarMuestra).mockResolvedValueOnce(initial);
      vi.mocked(updateMuestra).mockResolvedValue(updated);

      const { result } = renderHook(() => useMuestrasLibres(baseProps));

      await act(async () => { await result.current.addSample(15); });
      expect(result.current.muestras[0].observacion).toBe('');

      await act(async () => {
        await result.current.updateSample(0, { observacion: 'nota editada' });
      });

      expect(updateMuestra).toHaveBeenCalledWith(100, { observacion: 'nota editada' });
      expect(result.current.muestras[0].observacion).toBe('nota editada');
      expect(result.current.muestras).toHaveLength(1);
    });

    it('leaves muestras unchanged when updateMuestra rejects', async () => {
      const initial: Muestra = { ...mockMuestra, id: 100, observacion: 'original' } as Muestra;
      vi.mocked(registrarMuestra).mockResolvedValueOnce(initial);
      const apiError = new Error('boom');
      vi.mocked(updateMuestra).mockRejectedValue(apiError);
      const onApiError = vi.fn();

      const { result } = renderHook(() =>
        useMuestrasLibres({ ...baseProps, onApiError })
      );

      await act(async () => { await result.current.addSample(15); });

      await expect(
        act(async () => {
          await result.current.updateSample(0, { observacion: 'nueva' });
        })
      ).rejects.toThrow('boom');

      expect(onApiError).toHaveBeenCalledWith(apiError);
      expect(result.current.muestras[0].observacion).toBe('original');
    });
  });
});
