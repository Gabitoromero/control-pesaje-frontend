import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import Cookies from 'js-cookie';
import { cerrarSesionLinea } from '../../../api/auth';
import { setLogoutHandler } from '../../../api/axios';
import { resetSocket } from '../../../services/websocket';

vi.mock('js-cookie');
vi.mock('../../../api/auth', () => ({
  cerrarSesionLinea: vi.fn(),
}));
vi.mock('../../../api/axios', () => ({
  setLogoutHandler: vi.fn(),
  default: {},
}));
vi.mock('../../../services/websocket', () => ({
  resetSocket: vi.fn(),
}));

describe('AuthContext', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = {};
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => mockStorage[key] || null),
        setItem: vi.fn((key, value) => { mockStorage[key] = value.toString(); }),
        removeItem: vi.fn((key) => { delete mockStorage[key]; }),
        clear: vi.fn(() => { mockStorage = {}; }),
      },
      writable: true,
    });
  });

  it('registra setLogoutHandler al montar', () => {
    render(
      <AuthProvider>
        <div />
      </AuthProvider>
    );
    expect(setLogoutHandler).toHaveBeenCalled();
  });

  it('login setea el usuario decodificando del parametro y token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    
    act(() => {
      result.current.login({
        token: 'jwt-123',
        user: {
          id: 1, legajo: 'L1', nombreUsuario: 'Juan', rol: 'operario', puedeTomarMuestrasLibres: true
        }
      });
    });

    expect(Cookies.set).toHaveBeenCalledWith('token', 'jwt-123', expect.any(Object));
    expect(result.current.user?.legajo).toBe('L1');
    expect(result.current.token).toBe('jwt-123');
    expect(result.current.activeLineaId).toBeNull();
  });

  it('openLineSession setea el activeLineaId', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    
    act(() => {
      result.current.openLineSession(5);
    });

    expect(result.current.activeLineaId).toBe(5);
  });

  it('closeLineSession limpia activeLineaId y llama a la api', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    
    act(() => {
      result.current.openLineSession(5);
    });

    expect(result.current.activeLineaId).toBe(5);

    await act(async () => {
      await result.current.closeLineSession();
    });

    expect(result.current.activeLineaId).toBeNull();
    expect(cerrarSesionLinea).toHaveBeenCalled();
  });

  it('logout global limpia todo', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    act(() => {
      result.current.login({
        token: 'jwt-123',
        user: {
          id: 1, legajo: 'L1', nombreUsuario: 'Juan', rol: 'operario', puedeTomarMuestrasLibres: true
        }
      });
      result.current.openLineSession(5);
    });

    expect(result.current.activeLineaId).toBe(5);
    expect(result.current.user).toBeDefined();

    act(() => {
      result.current.logout();
    });

    expect(result.current.activeLineaId).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('login calls resetSocket to clear any previous socket singleton', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    act(() => {
      result.current.login({
        token: 'jwt-user-a',
        user: { id: 1, legajo: 'LA', nombreUsuario: 'UserA', rol: 'operario', puedeTomarMuestrasLibres: false },
      });
    });

    expect(resetSocket).toHaveBeenCalled();
  });

  it('logout calls resetSocket before clearing state (no cross-user socket leak)', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    act(() => {
      result.current.login({
        token: 'jwt-user-a',
        user: { id: 1, legajo: 'LA', nombreUsuario: 'UserA', rol: 'operario', puedeTomarMuestrasLibres: false },
      });
    });

    vi.mocked(resetSocket).mockClear();

    act(() => {
      result.current.logout();
    });

    expect(resetSocket).toHaveBeenCalledOnce();
    // activeLineaId must be null after logout — no state leak to next user
    expect(result.current.activeLineaId).toBeNull();
  });

  it('login sets activeLineaId to null — no cross-user leak from previous session', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    act(() => {
      result.current.openLineSession(7);
    });
    expect(result.current.activeLineaId).toBe(7);

    act(() => {
      result.current.login({
        token: 'jwt-user-b',
        user: { id: 2, legajo: 'LB', nombreUsuario: 'UserB', rol: 'operario', puedeTomarMuestrasLibres: false },
      });
    });

    expect(result.current.activeLineaId).toBeNull();
  });
});
