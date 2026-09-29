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

// Keep the real nested dashboard routes: the layout renders the matched child.
vi.mock('./layouts/DashboardLayout', () => ({
  DashboardLayout: () => <Outlet />,
}));

vi.mock('./features/dashboard/pages/MonitoreoPage', () => ({
  MonitoreoPage: () => <div>MonitoreoPage</div>,
}));

vi.mock('./features/dashboard/pages/MuestrasConfigPage', () => ({
  MuestrasConfigPage: () => <div>MuestrasConfigPage</div>,
}));

function mockUser(rol: UsuarioRol) {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    isAuthenticated: true,
    user: { id: 1, legajo: 'L1', nombreUsuario: 'Test', rol, puedeTomarMuestrasLibres: false },
    token: 'mock-token',
    activeLineaId: null,
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

describe('App /dashboard/muestras route (admin-only)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the Muestras page for ADMINISTRADOR', () => {
    mockUser(UsuarioRol.ADMINISTRADOR);
    renderAt('/dashboard/muestras');

    expect(screen.getByText('MuestrasConfigPage')).toBeInTheDocument();
  });

  it.each([
    ['JEFE', UsuarioRol.JEFE],
    ['VISUALIZACION', UsuarioRol.VISUALIZACION],
  ])('redirects %s to /dashboard', (_label, rol) => {
    mockUser(rol);
    renderAt('/dashboard/muestras');

    expect(screen.queryByText('MuestrasConfigPage')).not.toBeInTheDocument();
    expect(screen.getByText('MonitoreoPage')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
  });
});
