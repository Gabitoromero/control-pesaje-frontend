import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import Cookies from 'js-cookie';
import api from '../../../api/axios';
import React from 'react';

// Mock dependencies
vi.mock('js-cookie');
vi.mock('../../../api/axios', () => ({
  default: {
    post: vi.fn(),
  }
}));

const TestComponent = ({ lineaId }: { lineaId?: number }) => {
  const { deactivateLayer2Session } = useAuth();
  return (
    <button onClick={() => deactivateLayer2Session(lineaId)}>
      Salir
    </button>
  );
};

describe('AuthContext - deactivateLayer2Session', () => {
  const originalLocation = window.location;
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = {};
    
    // Mock window.location
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as Location;

    // Mock localStorage
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

  afterAll(() => {
    window.location = originalLocation;
  });

  it('llama al backend y hace logout completo para operarios', async () => {
    // Setup operario in localStorage
    localStorage.setItem('user', JSON.stringify({ id: 1, rol: 'operario' }));
    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true } });

    render(
      <AuthProvider>
        <TestComponent lineaId={5} />
      </AuthProvider>
    );

    await userEvent.click(screen.getByText('Salir'));

    // Verifica que llame al backend con el lineaId
    expect(api.post).toHaveBeenCalledWith('/auth/cerrar-sesion', { lineaProduccionId: 5 });
    
    // Verifica que haya hecho logout (cookies borradas, localStorage borrado, redirect a login)
    expect(Cookies.remove).toHaveBeenCalledWith('token');
    expect(localStorage.getItem('user')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('llama al backend y redirige al dashboard para administradores', async () => {
    // Setup administrador in localStorage
    localStorage.setItem('user', JSON.stringify({ id: 2, rol: 'administrador' }));
    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await userEvent.click(screen.getByText('Salir'));

    // Verifica que llame al backend (lineaId undefined)
    expect(api.post).toHaveBeenCalledWith('/auth/cerrar-sesion', { lineaProduccionId: undefined });
    
    // Verifica que NO haya hecho logout
    expect(Cookies.remove).not.toHaveBeenCalled();
    expect(localStorage.getItem('user')).not.toBeNull();
    
    // Verifica redirect a dashboard
    expect(window.location.href).toBe('/dashboard');
  });

  it('llama al backend y redirige al dashboard para jefes', async () => {
    // Setup jefe in localStorage
    localStorage.setItem('user', JSON.stringify({ id: 3, rol: 'jefe' }));
    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await userEvent.click(screen.getByText('Salir'));

    expect(api.post).toHaveBeenCalledWith('/auth/cerrar-sesion', { lineaProduccionId: undefined });
    expect(window.location.href).toBe('/dashboard');
  });
});
