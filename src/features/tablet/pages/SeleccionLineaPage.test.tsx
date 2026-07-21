import { screen, waitFor, within } from '@testing-library/react';
import { renderWithAuth } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import type { User } from '../../../shared/types/auth';
import { SeleccionLineaPage } from './SeleccionLineaPage';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers } from '../../../test/handlers';

const BASE = 'http://localhost:3000/api';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const operarioUser: User = {
  id: 3,
  legajo: 'O1',
  nombreUsuario: 'operario1',
  rol: 'operario',
  puedeTomarMuestrasLibres: false,
};

const jefeUser: User = {
  id: 4,
  legajo: 'J1',
  nombreUsuario: 'jefe1',
  rol: 'jefe',
  puedeTomarMuestrasLibres: true,
};

describe('SeleccionLineaPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

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

  it('encierra el contenido en un raíz de altura fija con región de scroll interna (sin scroll del body)', async () => {
    const { container } = renderWithAuth(<SeleccionLineaPage />, { user: operarioUser });
    const root = container.querySelector('[data-testid="tablet-page-root"]');
    expect(root).not.toBeNull();
    const scrollRegion = root?.querySelector('[data-testid="tablet-page-scroll"]');
    expect(scrollRegion).not.toBeNull();
    // The line list lives INSIDE the internal scroll region, never on the body
    const linea1 = await screen.findByText('Línea 1 — Envasado A');
    expect(scrollRegion?.contains(linea1)).toBe(true);
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

  it('navega a /tablet/pasadas con replace (sin apilar historial) y abre la sesión al hacer click en una línea', async () => {
    const { authValue } = renderWithAuth(<SeleccionLineaPage />, { user: operarioUser });
    const button = await screen.findByText('Línea 1 — Envasado A');
    await userEvent.click(button);
    expect(authValue.openLineSession).toHaveBeenCalledWith(1);
    expect(navigateMock).toHaveBeenCalledWith('/tablet/pasadas', {
      replace: true,
      state: { lineaId: 1, lineaNombre: 'Línea 1 — Envasado A' },
    });
  });

  it('llama a logout al hacer click en Salir si es operario', async () => {
    const { authValue } = renderWithAuth(<SeleccionLineaPage />, { user: operarioUser });
    const btnSalir = await screen.findByRole('button', { name: /salir/i });
    await userEvent.click(btnSalir);
    expect(authValue.logout).toHaveBeenCalled();
  });

  it('navega a /dashboard al hacer click en Salir si es jefe', async () => {
    const { authValue } = renderWithAuth(<SeleccionLineaPage />, { user: jefeUser });
    const btnSalir = await screen.findByRole('button', { name: /salir/i });
    await userEvent.click(btnSalir);
    expect(authValue.logout).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/dashboard');
  });

  it('muestra un toast de error con el mensaje del backend cuando la línea está ocupada (409)', async () => {
    server.use(
      http.post(`${BASE}/auth/sesion-linea`, () =>
        HttpResponse.json({ error: { message: 'Línea ocupada por otro operario' } }, { status: 409 })
      )
    );

    renderWithAuth(<SeleccionLineaPage />, { user: operarioUser });
    const button = await screen.findByText('Línea 1 — Envasado A');
    await userEvent.click(button);

    await waitFor(() => {
      const liveRegion = document.querySelector('[aria-live]');
      expect(liveRegion).toBeInTheDocument();
      expect(within(liveRegion as HTMLElement).getByText('Línea ocupada por otro operario')).toBeInTheDocument();
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('muestra un toast de error genérico cuando falla la activación por un motivo no-409', async () => {
    server.use(
      http.post(`${BASE}/auth/sesion-linea`, () =>
        HttpResponse.json({ error: { message: 'boom' } }, { status: 500 })
      )
    );

    renderWithAuth(<SeleccionLineaPage />, { user: operarioUser });
    const button = await screen.findByText('Línea 1 — Envasado A');
    await userEvent.click(button);

    await waitFor(() => {
      const liveRegion = document.querySelector('[aria-live]');
      expect(liveRegion).toBeInTheDocument();
      expect(within(liveRegion as HTMLElement).getByText('Error al activar la línea')).toBeInTheDocument();
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
