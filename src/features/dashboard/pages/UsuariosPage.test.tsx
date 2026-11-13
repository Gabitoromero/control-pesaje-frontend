import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers, pagedJson, usuariosMock, usuariosMockInactivos } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { UsuariosPage } from './UsuariosPage';
import { getSectorColor } from '../../../lib/sectores';

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
    await waitFor(() => expect(screen.queryByText('Admin Istrador')).not.toBeInTheDocument());
    expect(screen.queryByText('José Jefe')).not.toBeInTheDocument();

    await userEvent.clear(searchInput);

    expect(await screen.findByText('Admin Istrador')).toBeInTheDocument();
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

  it('sector select lists the four sectors and sends the chosen code inside datosAdicionales on create', async () => {
    let requestPayload: Record<string, unknown> | null = null;
    server.use(
      http.post('http://localhost:3000/api/usuarios', async ({ request }) => {
        requestPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: { id: 99, ...requestPayload } });
      })
    );

    renderWithProviders(<UsuariosPage />);
    await screen.findByText('Admin Istrador');
    await userEvent.click(screen.getByRole('button', { name: /nuevo usuario/i }));

    const select = screen.getByLabelText('Sector');
    const labels = within(select).getAllByRole('option').map((o) => o.textContent);
    expect(labels).toEqual(expect.arrayContaining(['Oficiales', 'Supervisores', 'Control de Calidad', 'Mejora Continua']));

    await userEvent.type(screen.getByLabelText('Legajo'), '99999');
    await userEvent.type(screen.getByLabelText('Nombre completo'), 'Test User');
    await userEvent.type(screen.getByLabelText('Nombre de usuario'), 'testuser');
    await userEvent.type(screen.getByLabelText(/PIN/), '1234');
    await userEvent.selectOptions(select, 'DD');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(requestPayload?.datosAdicionales).toEqual({ sector: 'DD' });
    });
  });

  it('editing a user preselects the stored sector and keeps the other datosAdicionales keys on save', async () => {
    let requestPayload: Record<string, unknown> | null = null;
    server.use(
      http.get('http://localhost:3000/api/usuarios', ({ request }) =>
        pagedJson(request, [
          { id: 7, nombreApellido: 'Sofía Sector', nombreUsuario: 'sofia', rol: 'operario', activo: true, legajo: '55555',
            datosAdicionales: { sector: 'MC', preferenciasInterfaz: { tema: 'oscuro' } } },
        ])
      ),
      http.put('http://localhost:3000/api/usuarios/:id', async ({ request }) => {
        requestPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: { id: 7, ...requestPayload } });
      })
    );

    renderWithProviders(<UsuariosPage />);
    const row = (await screen.findByText('Sofía Sector')).closest('tr')!;
    await userEvent.click(within(row).getByTitle('Editar'));

    const select = screen.getByLabelText('Sector') as HTMLSelectElement;
    expect(select.value).toBe('MC');

    await userEvent.selectOptions(select, 'OF');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(requestPayload?.datosAdicionales).toEqual({ sector: 'OF', preferenciasInterfaz: { tema: 'oscuro' } });
    });
  });

  it('choosing "Sin sector" on a user that has one sends sector null and keeps the other datosAdicionales keys', async () => {
    let requestPayload: Record<string, unknown> | null = null;
    server.use(
      http.get('http://localhost:3000/api/usuarios', ({ request }) =>
        pagedJson(request, [
          { id: 7, nombreApellido: 'Sofía Sector', nombreUsuario: 'sofia', rol: 'operario', activo: true, legajo: '55555',
            datosAdicionales: { sector: 'MC', preferenciasInterfaz: { tema: 'oscuro' } } },
        ])
      ),
      http.put('http://localhost:3000/api/usuarios/:id', async ({ request }) => {
        requestPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: { id: 7, ...requestPayload } });
      })
    );

    renderWithProviders(<UsuariosPage />);
    const row = (await screen.findByText('Sofía Sector')).closest('tr')!;
    await userEvent.click(within(row).getByTitle('Editar'));
    await userEvent.selectOptions(screen.getByLabelText('Sector'), '');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(requestPayload?.datosAdicionales).toEqual({ sector: null, preferenciasInterfaz: { tema: 'oscuro' } });
    });
  });

  it('users without sector still save without sending datosAdicionales', async () => {
    let requestPayload: Record<string, unknown> | null = null;
    server.use(
      http.put('http://localhost:3000/api/usuarios/:id', async ({ request }) => {
        requestPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: { id: 1, ...requestPayload } });
      })
    );

    renderWithProviders(<UsuariosPage />);
    const row = (await screen.findByText('Admin Istrador')).closest('tr')!;
    await userEvent.click(within(row).getByTitle('Editar'));
    expect((screen.getByLabelText('Sector') as HTMLSelectElement).value).toBe('');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(requestPayload).not.toBeNull());
    expect(requestPayload).not.toHaveProperty('datosAdicionales');
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

    await screen.findByText('No se pudo eliminar el usuario');
    await screen.findByText('No se puede eliminar: tiene registros asociados');
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

    await screen.findByText('No se pudo crear el usuario');
    await screen.findByText('Nombre de usuario en uso');
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

    await screen.findByText('No se pudo guardar el usuario');
    await screen.findByText('No se pudo actualizar');
  });

  describe('validation errors from the API', () => {
    const validationError = (issues: Array<{ path: Array<string | number>; message: string }>) =>
      http.put('http://localhost:3000/api/usuarios/:id', () =>
        HttpResponse.json(
          { success: false, error: { message: 'Validation error', details: issues } },
          { status: 400 }
        )
      );

    const openAdminAndSave = async () => {
      renderWithProviders(<UsuariosPage />);
      const adminRow = (await screen.findByText('Admin Istrador')).closest('tr')!;
      await userEvent.click(within(adminRow).getByTitle('Editar'));
      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    };

    it('marks the offending input and explains the reason under it and in the notification', async () => {
      server.use(validationError([{ path: ['legajo'], message: 'Debe tener exactamente 5 dígitos numéricos' }]));

      await openAdminAndSave();

      await screen.findByText('No se pudo guardar el usuario');
      const legajo = screen.getByLabelText('Legajo');
      await waitFor(() => expect(legajo).toBeInvalid());
      expect(legajo).toHaveAccessibleDescription('Debe tener exactamente 5 dígitos numéricos');
      expect(screen.getByText('Legajo: Debe tener exactamente 5 dígitos numéricos')).toBeInTheDocument();
      expect(screen.getByLabelText('Nombre completo')).toBeValid();
    });

    it('marks the Sector select when the API rejects datosAdicionales.sector', async () => {
      server.use(validationError([{ path: ['datosAdicionales', 'sector'], message: 'Sector inválido' }]));

      await openAdminAndSave();

      await waitFor(() => expect(screen.getByLabelText('Sector')).toBeInvalid());
      expect(screen.getByLabelText('Sector')).toHaveAccessibleDescription('Sector inválido');
      expect(screen.getByText('Sector: Sector inválido')).toBeInTheDocument();
    });

    it('clears the mark of an input as soon as the user edits it', async () => {
      server.use(validationError([{ path: ['legajo'], message: 'Debe tener exactamente 5 dígitos numéricos' }]));

      await openAdminAndSave();
      await waitFor(() => expect(screen.getByLabelText('Legajo')).toBeInvalid());

      await userEvent.type(screen.getByLabelText('Legajo'), '1');

      expect(screen.getByLabelText('Legajo')).toBeValid();
    });

    it('keeps showing only the message when the API sends no field details', async () => {
      server.use(
        http.put('http://localhost:3000/api/usuarios/:id', () =>
          HttpResponse.json({ success: false, error: { message: 'No se pudo actualizar' } }, { status: 400 })
        )
      );

      await openAdminAndSave();

      await screen.findByText('No se pudo actualizar');
      expect(screen.getByLabelText('Legajo')).toBeValid();
    });
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

  describe('sector column and filter', () => {
    const usuariosConSector = [
      { id: 11, nombreApellido: 'Ofelia Oficial', nombreUsuario: 'ofelia', rol: 'operario', activo: true, legajo: '10001', datosAdicionales: { sector: 'OF' } },
      { id: 12, nombreApellido: 'Dario Calidad', nombreUsuario: 'dario', rol: 'operario', activo: true, legajo: '10002', datosAdicionales: { sector: 'DD' } },
      { id: 13, nombreApellido: 'Nadia Nosector', nombreUsuario: 'nadia', rol: 'operario', activo: true, legajo: '10003' },
      { id: 14, nombreApellido: 'Marcos Mejora', nombreUsuario: 'marcos', rol: 'jefe', activo: true, legajo: '10004', datosAdicionales: { sector: 'MC', preferenciasInterfaz: { tema: 'oscuro' } } },
    ];
    const useSectorUsers = () =>
      server.use(
        http.get('http://localhost:3000/api/usuarios', ({ request }) => pagedJson(request, usuariosConSector))
      );
    const visible = (name: string) => screen.queryByText(name);

    it('shows a Sector column with a badge in the sector color, or a muted "Sin sector" badge', async () => {
      useSectorUsers();
      renderWithProviders(<UsuariosPage />);

      expect(await screen.findByRole('columnheader', { name: 'Sector' })).toBeInTheDocument();

      const conSector = (await screen.findByText('Ofelia Oficial')).closest('tr')!;
      const badge = within(conSector).getByText('Oficiales');
      expect(badge).toHaveStyle({ backgroundColor: getSectorColor('OF') });

      const sinSector = screen.getByText('Nadia Nosector').closest('tr')!;
      const neutral = within(sinSector).getByText('Sin sector');
      expect(neutral.style.backgroundColor).toBe('');
      expect(neutral.className).toContain('text-muted-foreground');
    });

    it('filters the list by sector, including users without sector, and "Todos los sectores" restores it', async () => {
      useSectorUsers();
      renderWithProviders(<UsuariosPage />);
      await screen.findByText('Ofelia Oficial');

      const select = screen.getByLabelText('Filtrar por sector') as HTMLSelectElement;
      expect(Array.from(select.options).map((o) => o.textContent)).toEqual([
        'Todos los sectores', 'Oficiales', 'Supervisores', 'Control de Calidad', 'Mejora Continua', 'Sin sector',
      ]);
      expect(select.value).toBe('');

      await userEvent.selectOptions(select, 'DD');
      await waitFor(() => expect(visible('Ofelia Oficial')).toBeNull());
      expect(visible('Dario Calidad')).toBeInTheDocument();
      expect(visible('Nadia Nosector')).toBeNull();
      expect(visible('Marcos Mejora')).toBeNull();

      await userEvent.selectOptions(select, 'sin-sector');
      await waitFor(() => expect(visible('Nadia Nosector')).toBeInTheDocument());
      expect(visible('Dario Calidad')).toBeNull();

      await userEvent.selectOptions(select, '');
      await waitFor(() => expect(visible('Ofelia Oficial')).toBeInTheDocument());
      ['Dario Calidad', 'Nadia Nosector', 'Marcos Mejora'].forEach((n) =>
        expect(visible(n)).toBeInTheDocument()
      );
    });

    it('combines the sector filter with the text search', async () => {
      useSectorUsers();
      renderWithProviders(<UsuariosPage />);
      await screen.findByText('Ofelia Oficial');

      await userEvent.selectOptions(screen.getByLabelText('Filtrar por sector'), 'OF');
      await userEvent.type(screen.getByPlaceholderText('Buscar...'), 'Dario');

      expect(await screen.findByText('No hay usuarios activos.')).toBeInTheDocument();
      expect(visible('Dario Calidad')).toBeNull();
    });
  });
});
