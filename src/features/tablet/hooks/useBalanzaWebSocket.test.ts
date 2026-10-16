import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useBalanzaWebSocket, PESO_STALE_TIMEOUT_MS } from './useBalanzaWebSocket';
import { getSocket } from '../../../services/websocket';
import { toast } from 'sonner';

vi.mock('../../../services/websocket', () => ({
  getSocket: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { info: vi.fn() },
}));

// Stable references: the hook lists logout/user as effect deps, so new
// identities per render would re-run the effect and clear the stale timer.
const authValue = vi.hoisted(() => ({ logout: () => {}, user: { id: 1 } }));
vi.mock('../../auth/context/AuthContext', () => ({
  useAuth: () => authValue,
}));

describe('useBalanzaWebSocket stale weight timeout', () => {
  let listeners: Record<string, (...args: unknown[]) => void>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(toast.info).mockClear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    listeners = {};
    const mockSocket = {
      connected: false,
      connect: vi.fn(),
      emit: vi.fn(),
      onAny: vi.fn(),
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        listeners[event] = handler;
      }),
      off: vi.fn(),
    };
    vi.mocked(getSocket).mockReturnValue(mockSocket as unknown as ReturnType<typeof getSocket>);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('uses a 5 second timeout', () => {
    expect(PESO_STALE_TIMEOUT_MS).toBe(5000);
  });

  it('resets pesoNeto to 0 after the timeout without new balanza-data', () => {
    const { result } = renderHook(() => useBalanzaWebSocket(1));

    act(() => {
      listeners['balanza-data']({ pesoNeto: 2.5 });
    });
    expect(result.current.pesoNeto).toBe(2.5);

    act(() => {
      vi.advanceTimersByTime(PESO_STALE_TIMEOUT_MS);
    });
    expect(result.current.pesoNeto).toBe(0);
  });

  it('keeps the weight while frames keep arriving', () => {
    const { result } = renderHook(() => useBalanzaWebSocket(1));

    act(() => {
      listeners['balanza-data']({ pesoNeto: 2.5 });
    });
    act(() => {
      vi.advanceTimersByTime(PESO_STALE_TIMEOUT_MS - 1);
    });
    act(() => {
      listeners['balanza-data']({ pesoNeto: 2.5 });
    });
    act(() => {
      vi.advanceTimersByTime(PESO_STALE_TIMEOUT_MS - 1);
    });

    expect(result.current.pesoNeto).toBe(2.5);

    // The re-armed timer must still fire once the full window elapses.
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.pesoNeto).toBe(0);
  });

  it('resets the weight when the effect re-runs with a different line', () => {
    const { result, rerender } = renderHook(({ id }) => useBalanzaWebSocket(id), {
      initialProps: { id: 1 },
    });

    act(() => {
      listeners['balanza-data']({ pesoNeto: 2.5 });
    });
    expect(result.current.pesoNeto).toBe(2.5);

    rerender({ id: 2 });

    expect(result.current.pesoNeto).toBe(0);
  });

  it.each([
    ['NaN', Number.NaN],
    ['undefined', undefined],
  ])('ignores a frame with pesoNeto %s: no weight change and no toast', (_label, bad) => {
    const { result } = renderHook(() => useBalanzaWebSocket(1));

    act(() => {
      listeners['balanza-data']({ pesoNeto: bad });
    });
    expect(result.current.pesoNeto).toBe(0);

    act(() => {
      vi.advanceTimersByTime(PESO_STALE_TIMEOUT_MS);
    });
    expect(toast.info).not.toHaveBeenCalled();
  });

  it('notifies the operator when a non-zero weight is reset by the timeout', () => {
    renderHook(() => useBalanzaWebSocket(1));

    act(() => {
      listeners['balanza-data']({ pesoNeto: 2.5 });
    });
    expect(toast.info).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(PESO_STALE_TIMEOUT_MS);
    });
    expect(toast.info).toHaveBeenCalledTimes(1);
  });

  it('does not notify when the last weight was already 0', () => {
    renderHook(() => useBalanzaWebSocket(1));

    act(() => {
      listeners['balanza-data']({ pesoNeto: 0 });
    });
    act(() => {
      vi.advanceTimersByTime(PESO_STALE_TIMEOUT_MS);
    });

    expect(toast.info).not.toHaveBeenCalled();
  });

  it('cancels the stale timer on disconnect so no second toast fires', () => {
    const { result } = renderHook(() => useBalanzaWebSocket(1));

    act(() => {
      listeners['balanza-data']({ pesoNeto: 2.5 });
    });
    act(() => {
      listeners['disconnect']();
    });
    expect(result.current.pesoNeto).toBe(0);

    act(() => {
      vi.advanceTimersByTime(PESO_STALE_TIMEOUT_MS);
    });
    expect(toast.info).not.toHaveBeenCalled();
  });

  it('cancels the stale timer when the scale reports offline so no second toast fires', () => {
    const { result } = renderHook(() => useBalanzaWebSocket(1));

    act(() => {
      listeners['balanza-data']({ pesoNeto: 2.5 });
    });
    act(() => {
      listeners['balanza-status']({ isConnected: false });
    });
    expect(result.current.pesoNeto).toBe(0);

    act(() => {
      vi.advanceTimersByTime(PESO_STALE_TIMEOUT_MS);
    });
    expect(toast.info).not.toHaveBeenCalled();
  });

  it('does not keep a pending timer after unmount', () => {
    const { unmount } = renderHook(() => useBalanzaWebSocket(1));

    act(() => {
      listeners['balanza-data']({ pesoNeto: 2.5 });
    });
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('useBalanzaWebSocket report support', () => {
  let listeners: Record<string, (...args: unknown[]) => void>;
  let socket: {
    connected: boolean;
    connect: ReturnType<typeof vi.fn>;
    emit: ReturnType<typeof vi.fn>;
    onAny: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    timeout: ReturnType<typeof vi.fn>;
  };
  // Emit used by `socket.timeout(ms).emit(...)`; tests drive the ack callback.
  let timeoutEmit: ReturnType<typeof vi.fn>;

  const ackWith = (err: Error | null, res?: unknown) => {
    timeoutEmit.mockImplementation((_event: string, _payload: unknown, cb: (e: Error | null, r?: unknown) => void) => {
      cb(err, res);
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    listeners = {};
    timeoutEmit = vi.fn();
    socket = {
      connected: true,
      connect: vi.fn(),
      emit: vi.fn(),
      onAny: vi.fn(),
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        listeners[event] = handler;
      }),
      off: vi.fn(),
      timeout: vi.fn(() => ({ emit: timeoutEmit })),
    };
    vi.mocked(getSocket).mockReturnValue(socket as unknown as ReturnType<typeof getSocket>);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('tracks socketConectado across connect and disconnect', () => {
    socket.connected = false;
    const { result } = renderHook(() => useBalanzaWebSocket(1));
    expect(result.current.socketConectado).toBe(false);

    act(() => {
      listeners['connect']();
    });
    expect(result.current.socketConectado).toBe(true);

    act(() => {
      listeners['disconnect']();
    });
    expect(result.current.socketConectado).toBe(false);
  });

  it('sends the v1 payload with the last weight kept after the stale reset', async () => {
    const { result } = renderHook(() => useBalanzaWebSocket(7));
    act(() => {
      listeners['balanza-status']({ isConnected: true, hardwareId: 'hw', unidad: 'kg' });
      listeners['balanza-data']({ pesoNeto: 45.2 });
    });
    act(() => {
      vi.advanceTimersByTime(12000);
    });
    expect(result.current.pesoNeto).toBe(0);

    ackWith(null, { ok: true, code: 'sent' });
    await act(async () => {
      await result.current.enviarReporteSinPeso('tablet');
    });

    expect(socket.timeout).toHaveBeenCalledWith(5000);
    expect(timeoutEmit).toHaveBeenCalledWith(
      'reportar-sin-peso',
      {
        v: 1,
        lineaId: 7,
        ultimoPeso: 45.2,
        ultimoPesoHaceMs: 12000,
        unidad: 'kg',
        socketConectado: true,
        balanzaConectada: true,
        enSala: true,
        pantalla: 'tablet',
        clientTs: Date.now(),
      },
      expect.any(Function),
    );
  });

  it('keeps the last frame after a disconnect', async () => {
    const { result } = renderHook(() => useBalanzaWebSocket(1));
    act(() => {
      listeners['balanza-data']({ pesoNeto: 3.5 });
      listeners['disconnect']();
    });
    // Reconnect so the emit is allowed.
    act(() => {
      listeners['connect']();
    });

    ackWith(null, { ok: true, code: 'sent' });
    await act(async () => {
      await result.current.enviarReporteSinPeso('muestras-libres');
    });

    const payload = timeoutEmit.mock.calls[0][1];
    expect(payload.ultimoPeso).toBe(3.5);
    expect(payload.pantalla).toBe('muestras-libres');
  });

  it('sends null weight and age when no frame was ever received, and no operator identity', async () => {
    const { result } = renderHook(() => useBalanzaWebSocket(1));
    ackWith(null, { ok: true, code: 'sent' });

    await act(async () => {
      await result.current.enviarReporteSinPeso('tablet');
    });

    const payload = timeoutEmit.mock.calls[0][1];
    expect(payload.ultimoPeso).toBeNull();
    expect(payload.ultimoPesoHaceMs).toBeNull();
    expect(payload.unidad).toBeNull();
    expect(payload.enSala).toBe(false);
    expect(payload.balanzaConectada).toBe(false);
    expect(Object.keys(payload).sort()).toEqual(
      ['balanzaConectada', 'clientTs', 'enSala', 'lineaId', 'pantalla', 'socketConectado', 'ultimoPeso', 'ultimoPesoHaceMs', 'unidad', 'v'].sort(),
    );
  });

  it('marks enSala false again after a disconnect', async () => {
    const { result } = renderHook(() => useBalanzaWebSocket(1));
    act(() => {
      listeners['balanza-status']({ isConnected: true });
      listeners['disconnect']();
      listeners['connect']();
    });
    ackWith(null, { ok: true, code: 'sent' });

    await act(async () => {
      await result.current.enviarReporteSinPeso('tablet');
    });

    expect(timeoutEmit.mock.calls[0][1].enSala).toBe(false);
  });

  it('forgets the last frame when the line changes', async () => {
    const { result, rerender } = renderHook(({ id }) => useBalanzaWebSocket(id), { initialProps: { id: 1 } });
    act(() => {
      listeners['balanza-data']({ pesoNeto: 9 });
    });
    rerender({ id: 2 });
    ackWith(null, { ok: true, code: 'sent' });

    await act(async () => {
      await result.current.enviarReporteSinPeso('tablet');
    });

    const payload = timeoutEmit.mock.calls[0][1];
    expect(payload.lineaId).toBe(2);
    expect(payload.ultimoPeso).toBeNull();
  });

  it('ignores non finite frames for the last weight', async () => {
    const { result } = renderHook(() => useBalanzaWebSocket(1));
    act(() => {
      listeners['balanza-data']({ pesoNeto: Number.NaN });
    });
    ackWith(null, { ok: true, code: 'sent' });

    await act(async () => {
      await result.current.enviarReporteSinPeso('tablet');
    });

    expect(timeoutEmit.mock.calls[0][1].ultimoPeso).toBeNull();
  });

  it.each([
    [{ ok: true, code: 'sent' }],
    [{ ok: false, code: 'cooldown', retryAfterMs: 40000 }],
    [{ ok: false, code: 'no-linea' }],
    [{ ok: false, code: 'invalid-payload' }],
    [{ ok: false, code: 'forbidden' }],
    [{ ok: false, code: 'error' }],
  ])('passes a valid ack through: %j', async (ack) => {
    const { result } = renderHook(() => useBalanzaWebSocket(1));
    ackWith(null, ack);

    let res: unknown;
    await act(async () => {
      res = await result.current.enviarReporteSinPeso('tablet');
    });

    expect(res).toEqual(ack);
  });

  it('resolves timeout when the ack never arrives', async () => {
    const { result } = renderHook(() => useBalanzaWebSocket(1));
    ackWith(new Error('operation has timed out'));

    let res: unknown;
    await act(async () => {
      res = await result.current.enviarReporteSinPeso('tablet');
    });

    expect(res).toEqual({ ok: false, code: 'timeout' });
  });

  it.each([
    ['unknown code', { ok: false, code: 'weird' }],
    ['cooldown without retryAfterMs', { ok: false, code: 'cooldown' }],
    ['not an object', 'nope'],
    ['undefined', undefined],
  ])('maps an invalid ack (%s) to error', async (_label, ack) => {
    const { result } = renderHook(() => useBalanzaWebSocket(1));
    ackWith(null, ack);

    let res: unknown;
    await act(async () => {
      res = await result.current.enviarReporteSinPeso('tablet');
    });

    expect(res).toEqual({ ok: false, code: 'error' });
  });

  it('does not emit and resolves sin-conexion while the socket is down', async () => {
    const { result } = renderHook(() => useBalanzaWebSocket(1));
    socket.connected = false;

    let res: unknown;
    await act(async () => {
      res = await result.current.enviarReporteSinPeso('tablet');
    });

    expect(res).toEqual({ ok: false, code: 'sin-conexion' });
    expect(socket.timeout).not.toHaveBeenCalled();
  });
});
