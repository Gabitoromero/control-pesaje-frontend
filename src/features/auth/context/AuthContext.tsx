import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import Cookies from 'js-cookie';
import type { User, AuthResponse } from '../../../shared/types/auth';
import { setLogoutHandler } from '../../../api/axios';
import { cerrarSesionLinea } from '../../../api/auth';
import { resetSocket, getSocket } from '../../../services/websocket';
import { useCallback, useEffect } from 'react';

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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
    window.location.href = '/login';
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
    try {
      if (activeLineaId) await cerrarSesionLinea(activeLineaId);
    } catch (error) {
      console.error('Failed to close line session:', error);
      // Even if API fails, clear local state
    }
    setActiveLineaId(null);
    try {
      localStorage.removeItem('activeLineaId');
    } catch { /* storage unavailable */ }
  }, [activeLineaId]);

  // Global listener for session termination
  useEffect(() => {
    if (!activeLineaId) return;

    const socket = getSocket();
    socket.connect();
    
    // Ensure the socket is in the room even if we are not in TabletWorkspace
    socket.emit('join-linea', activeLineaId);

    const onSesionCerrada = () => {
      console.log('[AuthContext] Sesión forzada a cerrar por un administrador.');
      alert('Tu sesión fue cerrada por un administrador.');
      logout();
      window.location.href = user?.rol === 'operario' ? '/' : '/dashboard';
    };

    socket.on('sesion-cerrada', onSesionCerrada);

    return () => {
      socket.off('sesion-cerrada', onSesionCerrada);
    };
  }, [activeLineaId, logout, user]);

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
