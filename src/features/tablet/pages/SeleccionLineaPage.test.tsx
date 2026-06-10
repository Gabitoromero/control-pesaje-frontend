import { screen } from '@testing-library/react';
import { renderWithAuth } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import type { User } from '../../../shared/types/auth';
import { SeleccionLineaPage } from './SeleccionLineaPage';
import { setupServer } from 'msw/node';
import { handlers } from '../../../test/handlers';

const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const operarioUser: User = {
  id: 3,
  nombreUsuario: 'operario1',
  rol: 'operario',
  puedeTomarMuestrasLibres: false,
};

describe('SeleccionLineaPage', () => {
  it('redirige a /login si no está autenticado', () => {
    renderWithAuth(<SeleccionLineaPage />, { initialEntries: ['/tablet/seleccion-linea'] });
    // Navigate renders nothing in MemoryRouter without a matching /login route,
    // so we assert the page content is NOT visible
    expect(screen.queryByText('Selección de Línea')).not.toBeInTheDocument();
  });

  it('muestra las líneas disponibles cuando está autenticado', async () => {
    renderWithAuth(<SeleccionLineaPage />, { user: operarioUser });
    expect(await screen.findByText('Línea 1 — Envasado A')).toBeInTheDocument();
    expect(screen.getByText('Línea 2 — Envasado B')).toBeInTheDocument();
    expect(screen.getByText('Línea 3 — Fraccionado')).toBeInTheDocument();
  });

  it('la línea ocupada está deshabilitada', async () => {
    renderWithAuth(<SeleccionLineaPage />, { user: operarioUser });
    const button = await screen.findByText('Línea 2 — Envasado B');
    const lineaOcupada = button.closest('button');
    expect(lineaOcupada).toBeDisabled();
  });

  it('las líneas disponibles están habilitadas', async () => {
    renderWithAuth(<SeleccionLineaPage />, { user: operarioUser });
    const button1 = await screen.findByText('Línea 1 — Envasado A');
    const button3 = screen.getByText('Línea 3 — Fraccionado');
    const linea1 = button1.closest('button');
    const linea3 = button3.closest('button');
    expect(linea1).not.toBeDisabled();
    expect(linea3).not.toBeDisabled();
  });

  it('muestra el nombre del usuario en el header', async () => {
    renderWithAuth(<SeleccionLineaPage />, { user: operarioUser });
    expect(await screen.findByText('operario1')).toBeInTheDocument();
  });

  it('las líneas disponibles muestran flecha de navegación', async () => {
    renderWithAuth(<SeleccionLineaPage />, { user: operarioUser });
    // Disponible lines show ArrowRight icon; occupied ones don't
    const button1 = await screen.findByText('Línea 1 — Envasado A');
    const button2 = screen.getByText('Línea 2 — Envasado B');
    const linea1 = button1.closest('button');
    const linea2 = button2.closest('button');
    expect(linea1?.querySelector('svg')).toBeInTheDocument();
    expect(linea2?.querySelector('svg')).not.toBeInTheDocument();
  });

  it('llama a logout al hacer click en Salir', async () => {
    const { authValue } = renderWithAuth(<SeleccionLineaPage />, { user: operarioUser });
    const btnSalir = await screen.findByRole('button', { name: /salir/i });
    await userEvent.click(btnSalir);
    expect(authValue.logout).toHaveBeenCalled();
  });
});
