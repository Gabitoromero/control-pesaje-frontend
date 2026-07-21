import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import Cookies from 'js-cookie';
import type { User, AuthResponse } from '../../../shared/types/auth';
import { setLogoutHandler } from '../../../api/axios';
import { cerrarSesionLinea } from '../../../api/auth';
import { resetSocket, getSocket } from '../../../services/websocket';
import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '../../../components/dialogs/useDialog';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  activeLineaId: number | null;
  isAuthenticated: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
  openLineSession: (lineaId: number) => void;
  closeLineSession: () => Promise<void>;
}
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Soft-logout navigation bridge ---------------------------------------
// AuthProvider renders OUTSIDE <BrowserRouter> in main.tsx
// (AuthProvider > App > BrowserRouter), so it cannot call useNavigate() itself.
// Instead, a tiny component rendered INSIDE the router registers the SPA
// `navigate` here; logout() uses it when available and falls back to the legacy
// hard `window.location.href` reload (preserving prior behavior) when the
// bridge is not mounted (e.g. isolated tests without the bridge).
type SpaNavigate = (to: string, opts?: { replace?: boolean }) => void;
let spaNavigate: SpaNavigate | null = null;

export function setSpaNavigate(fn: SpaNavigate | null): void {
  spaNavigate = fn;
}

function spaNavigateOrHardReload(to: string): void {
  if (spaNavigate) {
    spaNavigate(to, { replace: true });
  } else {
    window.location.href = to;
  }
}

/**
 * Render once inside the active <BrowserRouter>/<RouterProvider> so the SPA
 * navigate function is available to AuthProvider's logout logic.
 */
export const AuthNavigateBridge: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    setSpaNavigate((to, opts) => navigate(to, opts));
    return () => setSpaNavigate(null);
  }, [navigate]);
  return null;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { alertWarning } = useDialog();

  const [token, setToken] = useState<string | null>(() => {
    try { return Cookies.get('token') || null; } catch { return null; }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const tokenStr = Cookies.get('token');
      if (!tokenStr) return null;
      const payload = JSON.parse(atob(tokenStr.split('.')[1]));
      return {
        id: payload.id,
        legajo: payload.legajo,
        nombreUsuario: payload.nombreUsuario,
        rol: payload.rol,
        puedeTomarMuestrasLibres: payload.puedeTomarMuestrasLibres,
      };
    } catch {
      return null;
    }
  });

  const [activeLineaId, setActiveLineaId] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem('activeLineaId');
      return stored ? parseInt(stored, 10) : null;
    } catch {
      return null;
    }
  });

  const logout = useCallback(() => {
    resetSocket();
    setToken(null);
    setUser(null);
    setActiveLineaId(null);
    try {
      localStorage.removeItem('activeLineaId');
      Cookies.remove('token');
    } catch { /* storage unavailable */ }
    // SPA navigation preserves React Query cache and component state; falls back
    // to a hard reload if the AuthNavigateBridge isn't mounted (no router scope).
    spaNavigateOrHardReload('/login');
  }, []);

  useEffect(() => {
    setLogoutHandler(logout);
  }, [logout]);

  const login = useCallback((data: AuthResponse) => {
    resetSocket();
    setToken(data.token);
    setUser(data.user);
    setActiveLineaId(null);
    try {
      localStorage.removeItem('activeLineaId');
      const isHttps = window.location.protocol === 'https:';
      Cookies.set('token', data.token, { expires: 1, secure: isHttps, sameSite: 'strict' });
    } catch { /* storage unavailable */ }
  }, []);

  const openLineSession = useCallback((lineaId: number) => {
    setActiveLineaId(lineaId);
    try {
      localStorage.setItem('activeLineaId', lineaId.toString());
    } catch { /* storage unavailable */ }
  }, []);

  const closeLineSession = useCallback(async () => {
    const targetLineaId = activeLineaId;
    setActiveLineaId(null);
    try {
      localStorage.removeItem('activeLineaId');
    } catch { /* storage unavailable */ }

    if (targetLineaId) {
      try {
        await cerrarSesionLinea(targetLineaId);
      } catch (error) {
        console.error('Failed to close line session:', error);
      }
    }
  }, [activeLineaId]);

  // Global listener for session termination forced by an admin.
  // We also re-join the socket room on every reconnect so that the
  // 'sesion-cerrada' event is never missed, regardless of the current page.
  useEffect(() => {
    if (!activeLineaId) return;

    const socket = getSocket();
    socket.connect();

    const joinRoom = () => {
      socket.emit('join-linea', activeLineaId);
    };

    // Join immediately if already connected; 'connect' will handle future reconnects
    if (socket.connected) {
      joinRoom();
    }
    socket.on('connect', joinRoom);

    const onSesionCerrada = async () => {
      console.log('[AuthContext] Sesión forzada a cerrar por un administrador.');
      await alertWarning({
        title: 'Sesión cerrada',
        description: 'Tu sesión fue cerrada por un administrador.',
      });
      logout();
      const target = user?.rol === 'operario' ? '/' : '/dashboard';
      spaNavigateOrHardReload(target);
    };

    socket.on('sesion-cerrada', onSesionCerrada);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('sesion-cerrada', onSesionCerrada);
    };
  }, [activeLineaId, logout, user, alertWarning]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeLineaId,
        isAuthenticated: !!token,
        login,
        logout,
        openLineSession,
        closeLineSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
