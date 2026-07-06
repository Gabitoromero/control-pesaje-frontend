import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import Cookies from 'js-cookie';

// `Cookies.get` is overloaded (`get(name)` vs `get()`); `vi.mocked()` on an
// overloaded function infers the last signature's return type, so callers
// mocking the single-arg form need this one cast rather than `as any` at
// every `mockReturnValue` call site.
const mockCookiesGet = vi.mocked(Cookies.get) as unknown as Mock<
  (name: string) => string | undefined
>;

// Mock socket.io-client before importing websocket module
vi.mock('socket.io-client', () => {
  const mockSocket = {
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
  };
  const io = vi.fn().mockReturnValue(mockSocket);
  return { io, Socket: {} };
});

vi.mock('js-cookie');

describe('websocket singleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module between tests so `socket` singleton is null
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('getSocket() passes auth.token from the token cookie to io()', async () => {
    const { io } = await import('socket.io-client');
    mockCookiesGet.mockReturnValue('my-jwt-token');

    const { getSocket } = await import('./websocket');
    getSocket();

    expect(io).toHaveBeenCalledOnce();
    const callArgs = vi.mocked(io).mock.calls[0][1];
    expect((callArgs as Record<string, unknown>).auth).toEqual({ token: 'my-jwt-token' });
  });

  it('getSocket() passes auth.token as undefined when cookie is absent', async () => {
    const { io } = await import('socket.io-client');
    mockCookiesGet.mockReturnValue(undefined);

    const { getSocket } = await import('./websocket');
    getSocket();

    expect(io).toHaveBeenCalledOnce();
    const callArgs = vi.mocked(io).mock.calls[0][1];
    expect((callArgs as Record<string, unknown>).auth).toEqual({ token: undefined });
  });

  it('getSocket() returns the same instance on repeated calls (singleton)', async () => {
    const { io } = await import('socket.io-client');
    mockCookiesGet.mockReturnValue('token-a');

    const { getSocket } = await import('./websocket');
    const s1 = getSocket();
    const s2 = getSocket();

    expect(s1).toBe(s2);
    expect(io).toHaveBeenCalledOnce(); // io() called only once
  });

  it('resetSocket() disconnects the socket and clears the singleton reference', async () => {
    const { io } = await import('socket.io-client');
    const mockSocket = { disconnect: vi.fn(), removeAllListeners: vi.fn() };
    vi.mocked(io).mockReturnValue(mockSocket as unknown as ReturnType<typeof io>);
    mockCookiesGet.mockReturnValue('my-jwt-token');

    const { getSocket, resetSocket } = await import('./websocket');
    getSocket(); // creates socket

    resetSocket();

    expect(mockSocket.disconnect).toHaveBeenCalledOnce();
    expect(mockSocket.removeAllListeners).toHaveBeenCalledOnce();

    // After reset, getSocket() must call io() again with fresh cookie
    mockCookiesGet.mockReturnValue('new-jwt-token');
    getSocket();
    expect(io).toHaveBeenCalledTimes(2);
    const secondCallArgs = vi.mocked(io).mock.calls[1][1];
    expect((secondCallArgs as Record<string, unknown>).auth).toEqual({ token: 'new-jwt-token' });
  });

  it('resetSocket() is a no-op when no socket exists', async () => {
    const { resetSocket } = await import('./websocket');
    // Should not throw
    expect(() => resetSocket()).not.toThrow();
  });
});
