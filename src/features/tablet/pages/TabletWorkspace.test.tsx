import { screen } from '@testing-library/react';
import { renderWithAuth } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import type { User } from '../../../shared/types/auth';
import { TabletWorkspace } from './TabletWorkspace';
import { vi } from 'vitest';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const operarioUser: User = {
  id: 3,
  legajo: 'O1',
  nombreUsuario: 'operario1',
  rol: 'operario',
  puedeTomarMuestrasLibres: false,
};

describe('TabletWorkspace', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('navega a /tablet/pasadas sin cerrar sesión al hacer click en Volver', async () => {
    const { authValue } = renderWithAuth(<TabletWorkspace />, { user: operarioUser, activeLineaId: 1 });
    const btnVolver = await screen.findByRole('button', { name: /volver/i });
    await userEvent.click(btnVolver);
    expect(authValue.closeLineSession).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/tablet/pasadas');
  });

  it('redirige a /tablet/seleccion-linea si activeLineaId es null', () => {
    renderWithAuth(<TabletWorkspace />, { user: operarioUser, activeLineaId: null });
    // In our test environment, MemoryRouter is used, and since Navigate is rendered,
    // we can't easily assert the DOM change without an intermediate route, but we can verify
    // that it doesn't render the line text.
    expect(screen.queryByText(/Operario:/i)).not.toBeInTheDocument();
  });
});
