import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers, usuariosMock, usuariosMockInactivos } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { UsuariosPage } from './UsuariosPage';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UsuariosPage', () => {
  it('muestra la lista de usuarios activos e inactivos al cargar', async () => {
    renderWithProviders(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('operario1')).toBeInTheDocument();
      expect(screen.getByText('inactivo1')).toBeInTheDocument();
    });

    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getAllByText('Operario').length).toBeGreaterThan(0);
  });

  it('muestra el nombre completo de cada usuario', async () => {
    renderWithProviders(<UsuariosPage />);

    await screen.findByText('admin');

    expect(screen.getByText('Admin Istrador')).toBeInTheDocument();
    expect(screen.getByText('Pedro Operario')).toBeInTheDocument();
    expect(screen.getByText('Juan Inactivo')).toBeInTheDocument();
  });

  it('muestra el badge de estado para activos e inactivos', async () => {
    renderWithProviders(<UsuariosPage />);

    await screen.findByText('admin');

    const activeBadges = screen.getAllByText('Activo');
    const inactiveBadges = screen.getAllByText('Inactivo');

    expect(activeBadges).toHaveLength(usuariosMock.filter((u) => u.activo).length);
    expect(inactiveBadges).toHaveLength(usuariosMockInactivos.length);
  });

  it('abre el modal al hacer click en Nuevo Usuario', async () => {
    renderWithProviders(<UsuariosPage />);
    await screen.findByText('admin');

    await userEvent.click(screen.getByText('Nuevo Usuario'));

    expect(screen.getByText('Nuevo Usuario', { selector: 'h2' })).toBeInTheDocument();
  });

  it('muestra campo "Nombre completo" en el modal', async () => {
    renderWithProviders(<UsuariosPage />);
    await screen.findByText('admin');

    await userEvent.click(screen.getByText('Nuevo Usuario'));

    expect(screen.getByLabelText(/Nombre completo/)).toBeInTheDocument();
  });

  it('muestra checkbox "Puede tomar muestras libres" en el modal', async () => {
    renderWithProviders(<UsuariosPage />);
    await screen.findByText('admin');

    await userEvent.click(screen.getByText('Nuevo Usuario'));

    expect(screen.getByLabelText(/Puede tomar muestras libres/)).toBeInTheDocument();
  });

  it('muestra campos PIN y Contraseña para cualquier rol', async () => {
    renderWithProviders(<UsuariosPage />);
    await screen.findByText('admin');

    await userEvent.click(screen.getByText('Nuevo Usuario'));

    // Operario (default)
    expect(screen.getByLabelText(/PIN/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/)).toBeInTheDocument();

    // Cambiar a administrador — ambos campos siguen visibles
    await userEvent.selectOptions(screen.getByLabelText(/Rol/), 'administrador');
    expect(screen.getByLabelText(/PIN/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/)).toBeInTheDocument();
  });

  it('cierra el modal al hacer click en Cancelar', async () => {
    renderWithProviders(<UsuariosPage />);
    await screen.findByText('admin');

    await userEvent.click(screen.getByText('Nuevo Usuario'));
    await userEvent.click(screen.getByText('Cancelar'));

    expect(screen.queryByText('Nuevo Usuario', { selector: 'h2' })).not.toBeInTheDocument();
  });

  it('crea un usuario nuevo con PIN plano al enviar el formulario', async () => {
    let requestPayload: any = null;
    server.use(
      http.post('http://localhost:3000/api/usuarios', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 99, ...requestPayload } }, { status: 201 });
      })
    );

    renderWithProviders(<UsuariosPage />);
    await screen.findByText('admin');

    await userEvent.click(screen.getByText('Nuevo Usuario'));

    await userEvent.type(screen.getByLabelText(/Legajo/), '123456');
    await userEvent.type(screen.getByLabelText(/Nombre completo/), 'Nuevo Usuario');
    await userEvent.type(screen.getByLabelText(/Nombre de usuario/), 'nuevouser');
    await userEvent.type(screen.getByLabelText(/PIN/), '4321');
    await userEvent.type(screen.getByLabelText(/Contraseña/), 'password123');

    await userEvent.click(screen.getByRole('button', { name: /Guardar/ }));

    await waitFor(() => {
      expect(requestPayload).toEqual({
        legajo: '123456',
        nombreApellido: 'Nuevo Usuario',
        nombreUsuario: 'nuevouser',
        rol: 'operario',
        puedeTomarMuestrasLibres: false,
        contrasena: 'password123',
        pin: '4321',
      });
    });
  });

  it('pre-rellena el formulario al editar un usuario existente y envía PIN plano', async () => {
    let requestPayload: any = null;
    server.use(
      http.put('http://localhost:3000/api/usuarios/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 3, ...requestPayload } });
      })
    );

    renderWithProviders(<UsuariosPage />);

    const pedroText = await screen.findByText('Pedro Operario');
    const pedroRow = pedroText.closest('tr')!;
    const editButton = within(pedroRow).getByTitle('Editar');
    await userEvent.click(editButton);

    expect(screen.getByRole('heading', { name: 'Editar Usuario' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Pedro Operario')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1234')).toBeInTheDocument();

    // Legajo is required in the form, so fill it out
    const legajoInput = screen.getByLabelText(/Legajo/);
    await userEvent.type(legajoInput, '987654');

    const pinInput = screen.getByLabelText(/PIN/);
    await userEvent.clear(pinInput);
    await userEvent.type(pinInput, '654321');

    await userEvent.click(screen.getByRole('button', { name: /Guardar/ }));

    await waitFor(() => {
      expect(requestPayload).toEqual({
        legajo: '987654',
        nombreApellido: 'Pedro Operario',
        nombreUsuario: 'operario1',
        rol: 'operario',
        puedeTomarMuestrasLibres: true,
        pin: '654321',
      });
    });
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
