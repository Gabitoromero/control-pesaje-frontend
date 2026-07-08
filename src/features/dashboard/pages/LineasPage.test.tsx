import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';
import { handlers, lineasMock } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { LineasPage } from './LineasPage';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('LineasPage', () => {
  it('default mount shows only activos', async () => {
    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    expect(screen.getByText('Línea 2 — Envasado B')).toBeInTheDocument();
    expect(screen.getByText('Línea 3 — Fraccionado')).toBeInTheDocument();

    expect(screen.queryByText('Línea 4 — Inactiva A')).not.toBeInTheDocument();
    expect(screen.queryByText('Línea 5 — Inactiva B')).not.toBeInTheDocument();
  });

  it('wraps the table in a horizontal-scroll container so narrow viewports scroll instead of breaking the layout', async () => {
    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    const scrollWrapper = table.parentElement as HTMLElement;
    expect(scrollWrapper.className).toMatch(/overflow-x-auto/);
  });

  it('switching to inactivos shows only inactivos', async () => {
    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Línea 4 — Inactiva A')).toBeInTheDocument();
    });

    expect(screen.getByText('Línea 4 — Inactiva A')).toBeInTheDocument();
    expect(screen.getByText('Línea 5 — Inactiva B')).toBeInTheDocument();

    expect(screen.queryByText('Línea 1 — Envasado A')).not.toBeInTheDocument();
    expect(screen.queryByText('Línea 2 — Envasado B')).not.toBeInTheDocument();
    expect(screen.queryByText('Línea 3 — Fraccionado')).not.toBeInTheDocument();
  });

  it('typing search text filters activos by nombre; clearing restores full list', async () => {
    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar...');

    await userEvent.type(searchInput, 'envasado a');

    expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    expect(screen.queryByText('Línea 2 — Envasado B')).not.toBeInTheDocument();
    expect(screen.queryByText('Línea 3 — Fraccionado')).not.toBeInTheDocument();

    await userEvent.clear(searchInput);

    expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    expect(screen.getByText('Línea 2 — Envasado B')).toBeInTheDocument();
    expect(screen.getByText('Línea 3 — Fraccionado')).toBeInTheDocument();
  });

  it('"Activar Línea" button is visible when editing an inactive linea', async () => {
    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Línea 4 — Inactiva A')).toBeInTheDocument();
    });

    const lineaText = await screen.findByText('Línea 4 — Inactiva A');
    const lineaRow = lineaText.closest('tr')!;
    await userEvent.click(within(lineaRow).getByTitle('Editar'));

    expect(screen.getByRole('heading', { name: 'Editar Línea' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activar Línea' })).toBeInTheDocument();
  });

  it('"Activar Línea" button is NOT visible when editing an active linea', async () => {
    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const lineaText = await screen.findByText('Línea 1 — Envasado A');
    const lineaRow = lineaText.closest('tr')!;
    await userEvent.click(within(lineaRow).getByTitle('Editar'));

    expect(screen.getByRole('heading', { name: 'Editar Línea' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Activar Línea' })).not.toBeInTheDocument();
  });

  it('clicking "Activar Línea" sends PUT with activo:true; modal closes on success', async () => {
    let requestPayload: unknown = null;
    server.use(
      http.put('http://localhost:3000/api/lineas-produccion/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 4, ...(requestPayload as object) } });
      })
    );

    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Línea 4 — Inactiva A')).toBeInTheDocument();
    });

    const lineaText = await screen.findByText('Línea 4 — Inactiva A');
    const lineaRow = lineaText.closest('tr')!;
    await userEvent.click(within(lineaRow).getByTitle('Editar'));

    await userEvent.click(screen.getByRole('button', { name: 'Activar Línea' }));

    await waitFor(() => {
      expect((requestPayload as Record<string, unknown>).activo).toBe(true);
      expect(screen.queryByRole('heading', { name: 'Editar Línea' })).not.toBeInTheDocument();
    });
  });

  it('clicking "Activar Línea" shows an "activada" success dialog, not the generic "actualizada" copy', async () => {
    server.use(
      http.put('http://localhost:3000/api/lineas-produccion/:id', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ success: true, data: { id: 4, ...(body as object) } });
      })
    );

    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Línea 4 — Inactiva A')).toBeInTheDocument();
    });

    const lineaText = await screen.findByText('Línea 4 — Inactiva A');
    const lineaRow = lineaText.closest('tr')!;
    await userEvent.click(within(lineaRow).getByTitle('Editar'));

    // Assign a ruta activa before activating so this hits the "success" branch,
    // not the "no ruta" warning branch — isolates the accion-copy bug.
    const rutaSelect = screen.getByRole('combobox', { name: /ruta activa/i });
    await userEvent.selectOptions(rutaSelect, '1');

    await userEvent.click(screen.getByRole('button', { name: 'Activar Línea' }));

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Línea activada exitosamente')).toBeInTheDocument();
    expect(within(dialog).queryByText('Línea actualizada exitosamente')).not.toBeInTheDocument();
  });

  it('editing and clearing rutaPasadaActiva on an active linea sends PUT with rutaPasadaActiva: null', async () => {
    let requestPayload: unknown = null;
    server.use(
      http.put('http://localhost:3000/api/lineas-produccion/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 1, ...(requestPayload as object) } });
      })
    );

    // Override lineasMock GET to return a linea with rutaPasadaActiva set
    server.use(
      http.get('http://localhost:3000/api/lineas-produccion', () =>
        HttpResponse.json({
          success: true,
          data: [
            { id: 1, nombre: 'Línea 1 — Envasado A', estado: 'disponible', activo: true, numeroBalanza: 1, rutaPasadaActiva: 1 },
            ...lineasMock.slice(1),
          ],
        })
      )
    );

    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const lineaText = await screen.findByText('Línea 1 — Envasado A');
    const lineaRow = lineaText.closest('tr')!;
    await userEvent.click(within(lineaRow).getByTitle('Editar'));

    // Clear the rutaPasadaActiva select by choosing "-- Sin ruta --"
    const rutaSelect = screen.getByRole('combobox', { name: /ruta activa/i });
    await userEvent.selectOptions(rutaSelect, '');

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect((requestPayload as Record<string, unknown>).rutaPasadaActiva).toBeNull();
    });
  });

  it('editing and clearing rutaPasadaActiva on an inactive linea sends PUT with rutaPasadaActiva: null', async () => {
    let requestPayload: unknown = null;
    server.use(
      http.put('http://localhost:3000/api/lineas-produccion/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 4, ...(requestPayload as object) } });
      })
    );

    // Override inactive GET to include a rutaPasadaActiva
    server.use(
      http.get('http://localhost:3000/api/lineas-produccion/inactive', () =>
        HttpResponse.json({
          success: true,
          data: [
            { id: 4, nombre: 'Línea 4 — Inactiva A', activo: false, numeroBalanza: 4, rutaPasadaActiva: 1 },
            { id: 5, nombre: 'Línea 5 — Inactiva B', activo: false, numeroBalanza: 5 },
          ],
        })
      )
    );

    renderWithProviders(<LineasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Línea 4 — Inactiva A')).toBeInTheDocument();
    });

    const lineaText = await screen.findByText('Línea 4 — Inactiva A');
    const lineaRow = lineaText.closest('tr')!;
    await userEvent.click(within(lineaRow).getByTitle('Editar'));

    // Clear the rutaPasadaActiva select by choosing "-- Sin ruta --"
    const rutaSelect = screen.getByRole('combobox', { name: /ruta activa/i });
    await userEvent.selectOptions(rutaSelect, '');

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect((requestPayload as Record<string, unknown>).rutaPasadaActiva).toBeNull();
    });
  });

  describe('delete confirm dialog (replaces window.confirm)', () => {
    it('clicking "Eliminar Línea" opens a confirm dialog instead of window.confirm', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm');

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      const lineaText = await screen.findByText('Línea 1 — Envasado A');
      const lineaRow = lineaText.closest('tr')!;
      await userEvent.click(within(lineaRow).getByTitle('Editar'));

      await userEvent.click(screen.getByRole('button', { name: /eliminar línea/i }));

      const confirmDialog = await screen.findByRole('alertdialog');
      expect(confirmDialog).toHaveAccessibleName('¿Está seguro de eliminar esta línea?');
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('confirming the delete dialog sends the DELETE request and closes both dialogs', async () => {
      let deleteRequested = false;
      server.use(
        http.delete('http://localhost:3000/api/lineas-produccion/:id', () => {
          deleteRequested = true;
          return new HttpResponse(null, { status: 204 });
        })
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      const lineaText = await screen.findByText('Línea 1 — Envasado A');
      const lineaRow = lineaText.closest('tr')!;
      await userEvent.click(within(lineaRow).getByTitle('Editar'));

      await userEvent.click(screen.getByRole('button', { name: /eliminar línea/i }));

      const confirmDialog = await screen.findByRole('alertdialog');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }));

      await waitFor(() => {
        expect(deleteRequested).toBe(true);
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Editar Línea' })).not.toBeInTheDocument();
      });
    });

    it('cancelling the delete dialog does NOT send a DELETE request and keeps the edit modal open', async () => {
      let deleteRequested = false;
      server.use(
        http.delete('http://localhost:3000/api/lineas-produccion/:id', () => {
          deleteRequested = true;
          return new HttpResponse(null, { status: 204 });
        })
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      const lineaText = await screen.findByText('Línea 1 — Envasado A');
      const lineaRow = lineaText.closest('tr')!;
      await userEvent.click(within(lineaRow).getByTitle('Editar'));

      await userEvent.click(screen.getByRole('button', { name: /eliminar línea/i }));

      const confirmDialog = await screen.findByRole('alertdialog');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Cancelar' }));

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
      expect(deleteRequested).toBe(false);
      expect(screen.getByRole('heading', { name: 'Editar Línea' })).toBeInTheDocument();
    });
  });

  describe('error dialogs on mutation failure (replaces window.alert)', () => {
    it('create failure shows an alertdialog titled "No se pudo crear la línea"', async () => {
      server.use(
        http.post('http://localhost:3000/api/lineas-produccion', () =>
          HttpResponse.json({ success: false, error: { message: 'Balanza ya en uso' } }, { status: 400 })
        )
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /nueva línea/i }));
      await userEvent.type(screen.getByLabelText('Nombre'), 'Línea Nueva');
      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText('No se pudo crear la línea')).toBeInTheDocument();
      expect(within(dialog).getByText('Balanza ya en uso')).toBeInTheDocument();
    });

    it('update failure shows an alertdialog titled "No se pudo guardar la línea"', async () => {
      server.use(
        http.put('http://localhost:3000/api/lineas-produccion/:id', () =>
          HttpResponse.json({ success: false, error: { message: 'No se pudo actualizar' } }, { status: 400 })
        )
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      const lineaText = await screen.findByText('Línea 1 — Envasado A');
      const lineaRow = lineaText.closest('tr')!;
      await userEvent.click(within(lineaRow).getByTitle('Editar'));

      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText('No se pudo guardar la línea')).toBeInTheDocument();
      expect(within(dialog).getByText('No se pudo actualizar')).toBeInTheDocument();
    });

    it('delete failure shows an alertdialog titled "No se pudo eliminar la línea"', async () => {
      server.use(
        http.delete('http://localhost:3000/api/lineas-produccion/:id', () =>
          HttpResponse.json({ success: false, error: { message: 'En uso' } }, { status: 409 })
        )
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      const lineaText = await screen.findByText('Línea 1 — Envasado A');
      const lineaRow = lineaText.closest('tr')!;
      await userEvent.click(within(lineaRow).getByTitle('Editar'));

      await userEvent.click(screen.getByRole('button', { name: /eliminar línea/i }));

      const confirmDialog = await screen.findByRole('alertdialog');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }));

      const errorDialog = await screen.findByRole('alertdialog');
      expect(within(errorDialog).getByText('No se pudo eliminar la línea')).toBeInTheDocument();
      expect(within(errorDialog).getByText('En uso')).toBeInTheDocument();
    });
  });

  describe('success/warning dialog after mutation', () => {
    it('shows a success alertdialog after creating a línea with a ruta activa assigned', async () => {
      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /nueva línea/i }));

      await userEvent.type(screen.getByLabelText('Nombre'), 'Línea Nueva');
      const rutaSelect = screen.getByRole('combobox', { name: /ruta activa/i });
      await userEvent.selectOptions(rutaSelect, '1');

      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText('Línea creada exitosamente')).toBeInTheDocument();

      await userEvent.click(within(dialog).getByRole('button', { name: 'Aceptar' }));
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('shows a warning alertdialog after creating a línea without a ruta activa assigned', async () => {
      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /nueva línea/i }));

      await userEvent.type(screen.getByLabelText('Nombre'), 'Línea Sin Ruta');
      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText('Línea creada sin ruta activa')).toBeInTheDocument();
      expect(
        within(dialog).getByText(
          'La línea fue guardada correctamente, pero no tiene una ruta de pasada activa asignada.'
        )
      ).toBeInTheDocument();
    });

    it('shows a success alertdialog after updating a línea that keeps a ruta activa assigned', async () => {
      server.use(
        http.get('http://localhost:3000/api/lineas-produccion', () =>
          HttpResponse.json({
            success: true,
            data: [
              { id: 1, nombre: 'Línea 1 — Envasado A', estado: 'disponible', activo: true, numeroBalanza: 1, rutaPasadaActiva: { id: 1, nombre: 'Ruta Alpha' } },
              ...lineasMock.slice(1),
            ],
          })
        )
      );

      renderWithProviders(<LineasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      const lineaText = await screen.findByText('Línea 1 — Envasado A');
      const lineaRow = lineaText.closest('tr')!;
      await userEvent.click(within(lineaRow).getByTitle('Editar'));

      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText('Línea actualizada exitosamente')).toBeInTheDocument();
    });
  });
});
