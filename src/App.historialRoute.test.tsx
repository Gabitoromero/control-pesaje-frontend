import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Outlet } from 'react-router-dom';
import App from './App';
import * as AuthContext from './features/auth/context/AuthContext';
import { UsuarioRol } from './shared/types';
import { ThemeProvider } from './features/theme/ThemeContext';

vi.mock('./features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AuthNavigateBridge: () => null,
}));

// The real layout needs an active line and API data; only the route guard is under test here.
vi.mock('./features/tablet/pages/MuestrasLibresLayout', () => ({
  MuestrasLibresLayout: () => <Outlet />,
}));
vi.mock('./features/tablet/pages/HistorialPage', () => ({
  HistorialPage: () => <div>HistorialPage</div>,
}));
vi.mock('./features/dashboard/pages/HistorialDashboardPage', () => ({
  HistorialDashboardPage: () => <div>HistorialDashboardPage</div>,
}));
vi.mock('./features/tablet/pages/SeleccionLineaPage', () => ({
  SeleccionLineaPage: () => <div>SeleccionLineaPage</div>,
}));
vi.mock('./features/dashboard/pages/MonitoreoPage', () => ({
  MonitoreoPage: () => <div>MonitoreoPage</div>,
}));
vi.mock('./layouts/DashboardLayout', () => ({
  DashboardLayout: () => <Outlet />,
}));

function mockUser(rol: UsuarioRol, activeLineaId: number | null = 1) {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    isAuthenticated: true,
    user: { id: 1, legajo: 'L1', nombreUsuario: 'Test', rol, puedeTomarMuestrasLibres: false },
    token: 'mock-token',
    activeLineaId,
    openLineSession: vi.fn(),
    closeLineSession: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  });
}

function renderAt(path: string) {
  window.history.pushState({}, 'Test page', path);
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

describe('App /tablet/historial route (Planta roles only)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['OPERARIO', UsuarioRol.OPERARIO],
    ['JEFE', UsuarioRol.JEFE],
    ['ADMINISTRADOR', UsuarioRol.ADMINISTRADOR],
  ])('renders the history for %s', (_label, rol) => {
    mockUser(rol);
    renderAt('/tablet/historial');

    expect(screen.getByText('HistorialPage')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/tablet/historial');
  });

  it('redirects VISUALIZACION to its default route', () => {
    mockUser(UsuarioRol.VISUALIZACION);
    renderAt('/tablet/historial');

    expect(screen.queryByText('HistorialPage')).not.toBeInTheDocument();
    expect(screen.getByText('MonitoreoPage')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
  });

});

describe('App /dashboard/historial route (jefe and administrador)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['JEFE', UsuarioRol.JEFE],
    ['ADMINISTRADOR', UsuarioRol.ADMINISTRADOR],
  ])('renders the history inside the dashboard for %s, without a line session', (_label, rol) => {
    mockUser(rol, null);
    renderAt('/dashboard/historial');

    expect(screen.getByText('HistorialDashboardPage')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard/historial');
  });

  it.each([
    ['OPERARIO', UsuarioRol.OPERARIO],
    ['VISUALIZACION', UsuarioRol.VISUALIZACION],
  ])('does not show the dashboard history to %s', (_label, rol) => {
    mockUser(rol);
    renderAt('/dashboard/historial');

    expect(screen.queryByText('HistorialDashboardPage')).not.toBeInTheDocument();
    expect(window.location.pathname).not.toBe('/dashboard/historial');
  });
});
