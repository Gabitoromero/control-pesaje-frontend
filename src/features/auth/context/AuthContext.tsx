import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import Cookies from 'js-cookie';
import type { User, AuthResponse } from '../../../shared/types/auth';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
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
      Cookies.set('token', data.token, { expires: 1, secure: true, sameSite: 'strict' });
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
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
