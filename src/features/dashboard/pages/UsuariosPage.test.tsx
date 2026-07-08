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
  it('default mount shows only activos; inactivos are NOT present', async () => {
    renderWithProviders(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin Istrador')).toBeInTheDocument();
    });

    // All active users are visible
    expect(screen.getByText('Admin Istrador')).toBeInTheDocument();
    expect(screen.getByText('José Jefe')).toBeInTheDocument();
    expect(screen.getByText('Pedro Operario')).toBeInTheDocument();

    // Inactive users are NOT rendered
    usuariosMockInactivos.forEach((u) => {
      expect(screen.queryByText(u.nombreApellido)).not.toBeInTheDocument();
    });
  });

  it('wraps the table in a horizontal-scroll container so narrow viewports scroll instead of breaking the layout', async () => {
    renderWithProviders(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin Istrador')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    const scrollWrapper = table.parentElement as HTMLElement;
    expect(scrollWrapper.className).toMatch(/overflow-x-auto/);
  });

  it('switching status to "inactivo" shows only inactivos; activos are NOT present', async () => {
    renderWithProviders(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin Istrador')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Juan Inactivo')).toBeInTheDocument();
    });

    // Only inactivos are visible
    usuariosMockInactivos.forEach((u) => {
      expect(screen.getByText(u.nombreApellido)).toBeInTheDocument();
    });

    // Activos are NOT visible
    usuariosMock.forEach((u) => {
      expect(screen.queryByText(u.nombreApellido)).not.toBeInTheDocument();
    });
  });

  it('typing search text filters activos by nombreApellido; clearing restores full list', async () => {
    renderWithProviders(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin Istrador')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar...');

    await userEvent.type(searchInput, 'pedro');

    expect(screen.getByText('Pedro Operario')).toBeInTheDocument();
    expect(screen.queryByText('Admin Istrador')).not.toBeInTheDocument();
    expect(screen.queryByText('José Jefe')).not.toBeInTheDocument();

    await userEvent.clear(searchInput);

    expect(screen.getByText('Admin Istrador')).toBeInTheDocument();
    expect(screen.getByText('José Jefe')).toBeInTheDocument();
    expect(screen.getByText('Pedro Operario')).toBeInTheDocument();
  });

  it('"Activar Usuario" visible when editing inactive; NOT visible when editing active', async () => {
    renderWithProviders(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin Istrador')).toBeInTheDocument();
    });

    // Open edit modal for an active user — Activar should NOT appear
    const adminText = await screen.findByText('Admin Istrador');
    const adminRow = adminText.closest('tr')!;
    await userEvent.click(within(adminRow).getByTitle('Editar'));

    expect(screen.getByRole('heading', { name: 'Editar Usuario' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Activar Usuario' })).not.toBeInTheDocument();

    // Close the modal
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    // Switch to inactivos
    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Juan Inactivo')).toBeInTheDocument();
    });

    // Open edit modal for an inactive user — Activar SHOULD appear
    const juanText = await screen.findByText('Juan Inactivo');
    const juanRow = juanText.closest('tr')!;
    await userEvent.click(within(juanRow).getByTitle('Editar'));

    expect(screen.getByRole('heading', { name: 'Editar Usuario' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activar Usuario' })).toBeInTheDocument();
  });

  it('clicking "Activar Usuario" sends PUT with activo:true; modal closes on success', async () => {
    let requestPayload: unknown = null;
    server.use(
      http.put('http://localhost:3000/api/usuarios/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 4, ...(requestPayload as object) } });
      })
    );

    renderWithProviders(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin Istrador')).toBeInTheDocument();
    });

    // Switch to inactivos
    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Juan Inactivo')).toBeInTheDocument();
    });

    const juanText = await screen.findByText('Juan Inactivo');
    const juanRow = juanText.closest('tr')!;
    await userEvent.click(within(juanRow).getByTitle('Editar'));

    expect(screen.getByRole('heading', { name: 'Editar Usuario' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Activar Usuario' }));

    await waitFor(() => {
      expect((requestPayload as Record<string, unknown>).activo).toBe(true);
      expect(screen.queryByRole('heading', { name: 'Editar Usuario' })).not.toBeInTheDocument();
    });
  });

  it('"Eliminar Usuario" button is in modal footer for active usuario; NOT present in table row', async () => {
    renderWithProviders(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin Istrador')).toBeInTheDocument();
    });

    // No delete buttons in table rows — only Edit (title="Editar")
    const tableRows = screen.getAllByRole('row');
    // Skip header row (index 0)
    const dataRows = tableRows.slice(1);
    dataRows.forEach((row) => {
      expect(within(row).queryByTitle('Eliminar')).not.toBeInTheDocument();
      expect(within(row).queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument();
    });

    // Open modal for an active user
    const adminText = await screen.findByText('Admin Istrador');
    const adminRow = adminText.closest('tr')!;
    await userEvent.click(within(adminRow).getByTitle('Editar'));

    expect(screen.getByRole('heading', { name: 'Editar Usuario' })).toBeInTheDocument();

    // Eliminar button IS in the modal footer
    expect(screen.getByRole('button', { name: /Eliminar Usuario/ })).toBeInTheDocument();
  });

  it('deleteMutation onError shows an alertdialog titled "No se pudo eliminar el usuario" with the backend error message', async () => {
    server.use(
      http.delete('http://localhost:3000/api/usuarios/:id', () =>
        HttpResponse.json(
          { success: false, error: { message: 'No se puede eliminar: tiene registros asociados' } },
          { status: 500 }
        )
      )
    );

    renderWithProviders(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin Istrador')).toBeInTheDocument();
    });

    const adminText = await screen.findByText('Admin Istrador');
    const adminRow = adminText.closest('tr')!;
    await userEvent.click(within(adminRow).getByTitle('Editar'));

    expect(screen.getByRole('heading', { name: 'Editar Usuario' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Eliminar Usuario/ }));

    const confirmDialog = await screen.findByRole('alertdialog');
    await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }));

    const errorDialog = await screen.findByRole('alertdialog');
    expect(within(errorDialog).getByText('No se pudo eliminar el usuario')).toBeInTheDocument();
    expect(within(errorDialog).getByText('No se puede eliminar: tiene registros asociados')).toBeInTheDocument();
  });

  it('createMutation onError shows an alertdialog titled "No se pudo crear el usuario"', async () => {
    server.use(
      http.post('http://localhost:3000/api/usuarios', () =>
        HttpResponse.json({ success: false, error: { message: 'Nombre de usuario en uso' } }, { status: 400 })
      )
    );

    renderWithProviders(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin Istrador')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /nuevo usuario/i }));

    await userEvent.type(screen.getByLabelText('Legajo'), '999');
    await userEvent.type(screen.getByLabelText('Nombre completo'), 'Test User');
    await userEvent.type(screen.getByLabelText('Nombre de usuario'), 'testuser');
    await userEvent.type(screen.getByLabelText(/PIN/), '1234');

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('No se pudo crear el usuario')).toBeInTheDocument();
    expect(within(dialog).getByText('Nombre de usuario en uso')).toBeInTheDocument();
  });

  it('updateMutation onError shows an alertdialog titled "No se pudo guardar el usuario"', async () => {
    server.use(
      http.put('http://localhost:3000/api/usuarios/:id', () =>
        HttpResponse.json({ success: false, error: { message: 'No se pudo actualizar' } }, { status: 400 })
      )
    );

    renderWithProviders(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin Istrador')).toBeInTheDocument();
    });

    const adminText = await screen.findByText('Admin Istrador');
    const adminRow = adminText.closest('tr')!;
    await userEvent.click(within(adminRow).getByTitle('Editar'));

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('No se pudo guardar el usuario')).toBeInTheDocument();
    expect(within(dialog).getByText('No se pudo actualizar')).toBeInTheDocument();
  });

  it('clicking "Eliminar Usuario" opens a confirm dialog instead of window.confirm', async () => {
    renderWithProviders(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin Istrador')).toBeInTheDocument();
    });

    const adminText = await screen.findByText('Admin Istrador');
    const adminRow = adminText.closest('tr')!;
    await userEvent.click(within(adminRow).getByTitle('Editar'));

    await userEvent.click(screen.getByRole('button', { name: /Eliminar Usuario/ }));

    const confirmDialog = await screen.findByRole('alertdialog');
    expect(confirmDialog).toHaveAccessibleName('¿Está seguro de eliminar este usuario?');
  });

  it('confirming the delete dialog sends the DELETE request and closes both dialogs', async () => {
    let deleteRequested = false;
    server.use(
      http.delete('http://localhost:3000/api/usuarios/:id', () => {
        deleteRequested = true;
        return HttpResponse.json({ success: true, data: {} });
      })
    );

    renderWithProviders(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin Istrador')).toBeInTheDocument();
    });

    const adminText = await screen.findByText('Admin Istrador');
    const adminRow = adminText.closest('tr')!;
    await userEvent.click(within(adminRow).getByTitle('Editar'));

    await userEvent.click(screen.getByRole('button', { name: /Eliminar Usuario/ }));

    const confirmDialog = await screen.findByRole('alertdialog');
    await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(deleteRequested).toBe(true);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Editar Usuario' })).not.toBeInTheDocument();
    });
  });

  it('cancelling the delete dialog does NOT send a DELETE request and keeps the edit modal open', async () => {
    let deleteRequested = false;
    server.use(
      http.delete('http://localhost:3000/api/usuarios/:id', () => {
        deleteRequested = true;
        return HttpResponse.json({ success: true, data: {} });
      })
    );

    renderWithProviders(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin Istrador')).toBeInTheDocument();
    });

    const adminText = await screen.findByText('Admin Istrador');
    const adminRow = adminText.closest('tr')!;
    await userEvent.click(within(adminRow).getByTitle('Editar'));

    await userEvent.click(screen.getByRole('button', { name: /Eliminar Usuario/ }));

    const confirmDialog = await screen.findByRole('alertdialog');
    await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(deleteRequested).toBe(false);
    expect(screen.getByRole('heading', { name: 'Editar Usuario' })).toBeInTheDocument();
  });
});
