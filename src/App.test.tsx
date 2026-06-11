import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import * as AuthContext from './features/auth/context/AuthContext';
import { UsuarioRol } from './shared/types';

vi.mock('./features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./features/tablet/pages/SeleccionLineaPage', () => ({
  SeleccionLineaPage: () => <div>SeleccionLineaPage</div>,
}));

vi.mock('./features/tablet/pages/GestionPasadasPage', () => ({
  GestionPasadasPage: () => <div>GestionPasadasPage</div>,
}));

vi.mock('./features/tablet/pages/TabletWorkspace', () => ({
  TabletWorkspace: () => <div>TabletWorkspace</div>,
}));

vi.mock('./layouts/DashboardLayout', () => ({
  DashboardLayout: () => <div>DashboardLayout</div>,
}));

describe('App Component', () => {
  beforeEach(() => {
    window.history.pushState({}, 'Test page', '/');
  });

  it('navigates to login if not authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      activeLineaId: null,
      openLineSession: vi.fn(),
      closeLineSession: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Ingreso al sistema')).toBeInTheDocument();
  });

  it('navigates to tablet/seleccion-linea for OPERARIO', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, legajo: 'L1', nombreUsuario: 'Test', rol: UsuarioRol.OPERARIO, puedeTomarMuestrasLibres: false },
      token: 'mock-token',
      activeLineaId: null,
      openLineSession: vi.fn(),
      closeLineSession: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('SeleccionLineaPage')).toBeInTheDocument();
  });

  it('navigates to dashboard for ADMIN', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, legajo: 'A1', nombreUsuario: 'Test', rol: UsuarioRol.ADMINISTRADOR, puedeTomarMuestrasLibres: true },
      token: 'mock-token',
      activeLineaId: null,
      openLineSession: vi.fn(),
      closeLineSession: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('DashboardLayout')).toBeInTheDocument();
  });
});
