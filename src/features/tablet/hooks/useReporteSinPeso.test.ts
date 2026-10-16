import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast } from 'sonner';
import { useReporteSinPeso } from './useReporteSinPeso';
import type { ReportResult } from './useBalanzaWebSocket';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('useReporteSinPeso', () => {
  let enviar: ReturnType<typeof vi.fn<(pantalla: 'tablet' | 'muestras-libres') => Promise<ReportResult>>>;

  const setup = (socketConectado = true) =>
    renderHook(
      ({ conectado }) => useReporteSinPeso({ socketConectado: conectado, enviar, pantalla: 'tablet' }),
      { initialProps: { conectado: socketConectado } },
    );

  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    enviar = vi.fn(() => Promise.resolve({ ok: true, code: 'sent' } as ReportResult));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts idle and enabled when the socket is connected', () => {
    const { result } = setup();
    expect(result.current.estado).toBe('idle');
    expect(result.current.deshabilitado).toBe(false);
    expect(result.current.motivoDeshabilitado).toBeUndefined();
  });

  it('is disabled with a reason when the socket is down and does not send', async () => {
    const { result } = setup(false);
    expect(result.current.deshabilitado).toBe(true);
    expect(result.current.motivoDeshabilitado).toBe('Sin conexión con el servidor');

    await act(async () => {
      await result.current.reportar();
    });
    expect(enviar).not.toHaveBeenCalled();
  });

  it('passes the screen to the sender', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.reportar();
    });
    expect(enviar).toHaveBeenCalledWith('tablet');
  });

  it('shows enviando immediately and blocks further presses while pending', async () => {
    let resolve!: (r: ReportResult) => void;
    enviar.mockImplementation(() => new Promise<ReportResult>((r) => { resolve = r; }));
    const { result } = setup();

    act(() => {
      void result.current.reportar();
    });
    expect(result.current.estado).toBe('enviando');
    expect(result.current.deshabilitado).toBe(true);

    await act(async () => {
      await result.current.reportar();
    });
    expect(enviar).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve({ ok: false, code: 'error' });
    });
    expect(result.current.estado).toBe('idle');
  });

  it('on sent: success toast and a local 60 s cooldown that counts down and re-enables', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.reportar();
    });

    expect(toast.success).toHaveBeenCalledWith('Reporte enviado al equipo técnico');
    expect(result.current.estado).toBe('enfriamiento');
    expect(result.current.segundosRestantes).toBe(60);
    expect(result.current.deshabilitado).toBe(true);

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(result.current.segundosRestantes).toBe(50);

    act(() => {
      vi.advanceTimersByTime(50_000);
    });
    expect(result.current.estado).toBe('idle');
    expect(result.current.deshabilitado).toBe(false);
  });

  it('on cooldown: counts down from retryAfterMs without a toast and re-enables at 0', async () => {
    enviar.mockResolvedValue({ ok: false, code: 'cooldown', retryAfterMs: 40_000 });
    const { result } = setup();
    await act(async () => {
      await result.current.reportar();
    });

    expect(result.current.estado).toBe('enfriamiento');
    expect(result.current.segundosRestantes).toBe(40);
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(40_000);
    });
    expect(result.current.estado).toBe('idle');
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['timeout', 'error', 'no-linea', 'invalid-payload', 'forbidden', 'sin-conexion'] as const)(
    'on %s: error toast and back to idle so the operator can retry',
    async (code) => {
      enviar.mockResolvedValue({ ok: false, code } as ReportResult);
      const { result } = setup();
      await act(async () => {
        await result.current.reportar();
      });

      expect(toast.error).toHaveBeenCalledWith('No se pudo enviar el reporte. Intente nuevamente.');
      expect(result.current.estado).toBe('idle');
      expect(result.current.deshabilitado).toBe(false);
    },
  );

  it('does not tick while idle and clears the interval on unmount', async () => {
    const { result, unmount } = setup();
    expect(vi.getTimerCount()).toBe(0);

    await act(async () => {
      await result.current.reportar();
    });
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
