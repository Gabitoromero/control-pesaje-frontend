import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import Cookies from 'js-cookie';
import type { User, AuthResponse } from '../../../shared/types/auth';
import api from '../../../api/axios';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
  deactivateLayer2Session: (lineaId?: number) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try { return Cookies.get('token') || null; } catch { return null; }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return null;
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  });

  const login = (data: AuthResponse) => {
    setToken(data.token);
    setUser(data.user);
    try {
      const isHttps = window.location.protocol === 'https:';
      Cookies.set('token', data.token, { expires: 1, secure: isHttps, sameSite: 'strict' });
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch { /* storage unavailable */ }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      Cookies.remove('token');
      localStorage.removeItem('user');
    } catch { /* storage unavailable */ }
    window.location.href = '/login';
  };

  const deactivateLayer2Session = async (lineaId?: number) => {
    try {
      await api.post('/auth/cerrar-sesion', { lineaProduccionId: lineaId });
    } catch (error) {
      console.error('Failed to close layer 2 session:', error);
      alert('Error al cerrar la sesión de la línea');
    }

    if (user?.rol === 'administrador' || user?.rol === 'jefe') {
      window.location.href = '/dashboard';
    } else {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        deactivateLayer2Session,
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
