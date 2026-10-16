import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useActividadHeartbeat, resolveHeartbeatInterval } from './useActividadHeartbeat';
import { AxiosError } from 'axios';
import { actualizarActividad } from '../../../api/auth';

vi.mock('../../../api/auth', () => ({
  actualizarActividad: vi.fn().mockResolvedValue(undefined),
}));

describe('resolveHeartbeatInterval', () => {
  it('devuelve el valor del env cuando es un número positivo válido', () => {
    expect(resolveHeartbeatInterval('5000')).toBe(5000);
  });

  it('devuelve el default (120000) cuando el env es undefined', () => {
    expect(resolveHeartbeatInterval(undefined)).toBe(120000);
  });

  it('devuelve el default cuando el env no es un número finito positivo', () => {
    expect(resolveHeartbeatInterval('abc')).toBe(120000);
    expect(resolveHeartbeatInterval('0')).toBe(120000);
    expect(resolveHeartbeatInterval('-100')).toBe(120000);
  });
});

describe('useActividadHeartbeat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(actualizarActividad).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('no llama a la api si lineaId es null', () => {
    renderHook(() => useActividadHeartbeat(null));
    vi.advanceTimersByTime(120000);
    expect(actualizarActividad).not.toHaveBeenCalled();
  });

  it('llama a actualizarActividad cada 2 minutos cuando lineaId no es null', () => {
    renderHook(() => useActividadHeartbeat(5));
    
    // Al principio no lo llama
    expect(actualizarActividad).not.toHaveBeenCalled();
    
    // A los 2 minutos (120000ms)
    vi.advanceTimersByTime(120000);
    expect(actualizarActividad).toHaveBeenCalledTimes(1);

    // A los 4 minutos
    vi.advanceTimersByTime(120000);
    expect(actualizarActividad).toHaveBeenCalledTimes(2);
  });

  it('limpia el timer al desmontar', () => {
    const { unmount } = renderHook(() => useActividadHeartbeat(5));
    unmount();
    
    vi.advanceTimersByTime(120000);
    expect(actualizarActividad).not.toHaveBeenCalled();
  });
  describe('sesión perdida', () => {
    const httpError = (status: number) =>
      new AxiosError('fail', 'ERR_BAD_REQUEST', undefined, undefined, {
        status,
        statusText: '',
        data: {},
        headers: {},
        config: {} as never,
      });

    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('llama a onSessionLost una sola vez con 404 y deja de enviar latidos', async () => {
      vi.mocked(actualizarActividad).mockRejectedValue(httpError(404));
      const onSessionLost = vi.fn();
      renderHook(() => useActividadHeartbeat(5, onSessionLost));

      await vi.advanceTimersByTimeAsync(120000);
      expect(onSessionLost).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(240000);
      expect(actualizarActividad).toHaveBeenCalledTimes(1);
      expect(onSessionLost).toHaveBeenCalledTimes(1);
    });

    it('con 500 no llama a onSessionLost y sigue reintentando', async () => {
      vi.mocked(actualizarActividad).mockRejectedValue(httpError(500));
      const onSessionLost = vi.fn();
      renderHook(() => useActividadHeartbeat(5, onSessionLost));

      await vi.advanceTimersByTimeAsync(240000);
      expect(onSessionLost).not.toHaveBeenCalled();
      expect(actualizarActividad).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalled();
    });

    it('con error de red no llama a onSessionLost y sigue reintentando', async () => {
      vi.mocked(actualizarActividad).mockRejectedValue(new Error('Network Error'));
      const onSessionLost = vi.fn();
      renderHook(() => useActividadHeartbeat(5, onSessionLost));

      await vi.advanceTimersByTimeAsync(240000);
      expect(onSessionLost).not.toHaveBeenCalled();
      expect(actualizarActividad).toHaveBeenCalledTimes(2);
    });

    it('sin callback un 404 conserva el comportamiento anterior (log y sigue latiendo)', async () => {
      vi.mocked(actualizarActividad).mockRejectedValue(httpError(404));
      renderHook(() => useActividadHeartbeat(5));

      await vi.advanceTimersByTimeAsync(240000);
      expect(actualizarActividad).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalled();
    });

    it('no llama a onSessionLost si el 404 llega después de desmontar', async () => {
      let rejectCall: (e: unknown) => void = () => {};
      vi.mocked(actualizarActividad).mockReturnValue(
        new Promise<void>((_, reject) => {
          rejectCall = reject;
        }),
      );
      const onSessionLost = vi.fn();
      const { unmount } = renderHook(() => useActividadHeartbeat(5, onSessionLost));

      await vi.advanceTimersByTimeAsync(120000);
      unmount();
      rejectCall(httpError(404));
      await vi.advanceTimersByTimeAsync(0);

      expect(onSessionLost).not.toHaveBeenCalled();
    });
  });
});
