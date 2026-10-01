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

  it('does not keep a pending timer after unmount', () => {
    const { unmount } = renderHook(() => useBalanzaWebSocket(1));

    act(() => {
      listeners['balanza-data']({ pesoNeto: 2.5 });
    });
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
