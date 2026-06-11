import { screen } from '@testing-library/react';
import { renderWithAuth } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import type { User } from '../../../shared/types/auth';
import { GestionPasadasPage } from './GestionPasadasPage';
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

describe('GestionPasadasPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('llama a closeLineSession al hacer click en Volver', async () => {
    const { authValue } = renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });
    const btnVolver = await screen.findByRole('button', { name: /volver/i });
    await userEvent.click(btnVolver);
    expect(authValue.closeLineSession).toHaveBeenCalled();
  });

  it('muestra la lista de pasadas mockeadas', async () => {
    renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });
    expect(await screen.findByText('Pasada #101')).toBeInTheDocument();
    expect(screen.getByText('Pasada #102')).toBeInTheDocument();
  });

  it('navega al workspace al hacer click en Continuar en una pasada', async () => {
    // Assuming the continue button has 'Continuar' text
    renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });
    const btnContinuar = await screen.findAllByRole('button', { name: /continuar/i });
    expect(btnContinuar.length).toBeGreaterThan(0);
    await userEvent.click(btnContinuar[0]);
    expect(navigateMock).toHaveBeenCalledWith('/tablet');
  });

  it('redirige si activeLineaId es null', () => {
    renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: null });
    expect(screen.queryByText('Gestión de Pasadas')).not.toBeInTheDocument();
  });
});
