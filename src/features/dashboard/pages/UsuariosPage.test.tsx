import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers, usuariosMock } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { UsuariosPage } from './UsuariosPage';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UsuariosPage', () => {
  it('muestra la lista de usuarios al cargar', async () => {
    renderWithProviders(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('operario1')).toBeInTheDocument();
    });

    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getAllByText('Operario').length).toBeGreaterThan(0);
  });

  it('muestra el badge de estado correctamente', async () => {
    renderWithProviders(<UsuariosPage />);

    await screen.findByText('admin');

    const activeBadges = screen.getAllByText('Activo');
    const inactiveBadges = screen.getAllByText('Inactivo');

    const activeUsers = usuariosMock.filter((u) => u.activo !== false);
    const inactiveUsers = usuariosMock.filter((u) => u.activo === false);

    expect(activeBadges).toHaveLength(activeUsers.length);
    expect(inactiveBadges).toHaveLength(inactiveUsers.length);
  });

  it('abre el modal al hacer click en Nuevo Usuario', async () => {
    renderWithProviders(<UsuariosPage />);
    await screen.findByText('admin');

    await userEvent.click(screen.getByText('Nuevo Usuario'));

    expect(screen.getByText('Nuevo Usuario', { selector: 'h2' })).toBeInTheDocument();
  });

  it('muestra campo PIN cuando el rol es Operario', async () => {
    renderWithProviders(<UsuariosPage />);
    await screen.findByText('admin');

    await userEvent.click(screen.getByText('Nuevo Usuario'));

    expect(screen.getByLabelText(/PIN/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Contraseña/)).not.toBeInTheDocument();
  });

  it('muestra campo Contraseña cuando el rol no es Operario', async () => {
    renderWithProviders(<UsuariosPage />);
    await screen.findByText('admin');

    await userEvent.click(screen.getByText('Nuevo Usuario'));
    await userEvent.selectOptions(screen.getByLabelText(/Rol/), 'administrador');

    expect(screen.getByLabelText(/Contraseña/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/PIN/)).not.toBeInTheDocument();
  });

  it('cierra el modal al hacer click en Cancelar', async () => {
    renderWithProviders(<UsuariosPage />);
    await screen.findByText('admin');

    await userEvent.click(screen.getByText('Nuevo Usuario'));
    await userEvent.click(screen.getByText('Cancelar'));

    expect(screen.queryByText('Nuevo Usuario', { selector: 'h2' })).not.toBeInTheDocument();
  });

  it('muestra mensaje de error cuando falla la carga', async () => {
    server.use(
      http.get('http://localhost:3000/api/usuarios', () =>
        HttpResponse.json({ success: false }, { status: 500 })
      )
    );

    renderWithProviders(<UsuariosPage />);

    await screen.findByText(/Error al cargar usuarios/);
  });
});
