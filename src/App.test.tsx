import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import * as AuthContext from './features/auth/context/AuthContext';
import { UsuarioRol } from './shared/types';
import { ThemeProvider } from './features/theme/ThemeContext';

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

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
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    window.history.pushState({}, 'Test page', '/');
    mockStorage = {};

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => mockStorage[key] ?? null,
        setItem: (key: string, value: string) => {
          mockStorage[key] = value.toString();
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
        clear: () => {
          mockStorage = {};
        },
      },
      writable: true,
      configurable: true,
    });
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

    renderApp();
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

    renderApp();
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

    renderApp();
    expect(screen.getByText('DashboardLayout')).toBeInTheDocument();
  });

  describe('dev-only theme toggle gate', () => {
    beforeEach(() => {
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
    });

    it('does not render the toggle without ?devTheme=1', () => {
      window.history.pushState({}, 'Test page', '/');
      renderApp();
      expect(screen.queryByLabelText('Toggle theme')).not.toBeInTheDocument();
    });

    it('renders the toggle with ?devTheme=1', () => {
      window.history.pushState({}, 'Test page', '/?devTheme=1');
      renderApp();
      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
    });

    it('does not render the toggle for a non-exact devTheme value', () => {
      window.history.pushState({}, 'Test page', '/?devTheme=0');
      renderApp();
      expect(screen.queryByLabelText('Toggle theme')).not.toBeInTheDocument();
    });
  });
});
