import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';
import { handlers, articulosMock } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { ArticulosPage } from './ArticulosPage';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

describe('ArticulosPage', () => {
  it('default mount shows only activos and "Código" column header is NOT present', async () => {
    renderWithProviders(<ArticulosPage />);

    await waitFor(() => {
      expect(screen.getByText('Harina 000')).toBeInTheDocument();
    });

    expect(screen.getByText('Harina 000')).toBeInTheDocument();
    expect(screen.getByText('Azúcar')).toBeInTheDocument();
    expect(screen.getByText('Sal fina')).toBeInTheDocument();

    // Inactivos should NOT be present by default
    expect(screen.queryByText('Levadura seca')).not.toBeInTheDocument();
    expect(screen.queryByText('Manteca')).not.toBeInTheDocument();

    // "Código" column header must NOT appear in the table
    const headers = screen.getAllByRole('columnheader');
    const headerTexts = headers.map((h) => h.textContent?.toLowerCase() ?? '');
    expect(headerTexts.some((t) => t.includes('código'))).toBe(false);
  });

  it('wraps the table in a horizontal-scroll container so narrow viewports scroll instead of breaking the layout', async () => {
    renderWithProviders(<ArticulosPage />);

    await waitFor(() => {
      expect(screen.getByText('Harina 000')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    const scrollWrapper = table.parentElement as HTMLElement;
    expect(scrollWrapper.className).toMatch(/overflow-x-auto/);
  });

  it('switching status dropdown to "Inactivos" shows only inactivos', async () => {
    renderWithProviders(<ArticulosPage />);

    await waitFor(() => {
      expect(screen.getByText('Harina 000')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Levadura seca')).toBeInTheDocument();
    });

    expect(screen.getByText('Levadura seca')).toBeInTheDocument();
    expect(screen.getByText('Manteca')).toBeInTheDocument();

    // Activos should NOT be present
    expect(screen.queryByText('Harina 000')).not.toBeInTheDocument();
    expect(screen.queryByText('Azúcar')).not.toBeInTheDocument();
  });

  it('typing search text filters activos by nombre; clearing restores full list', async () => {
    renderWithProviders(<ArticulosPage />);

    await waitFor(() => {
      expect(screen.getByText('Harina 000')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar...');

    await userEvent.type(searchInput, 'harina');

    expect(screen.getByText('Harina 000')).toBeInTheDocument();
    expect(screen.queryByText('Azúcar')).not.toBeInTheDocument();
    expect(screen.queryByText('Sal fina')).not.toBeInTheDocument();

    await userEvent.clear(searchInput);

    expect(screen.getByText('Harina 000')).toBeInTheDocument();
    expect(screen.getByText('Azúcar')).toBeInTheDocument();
    expect(screen.getByText('Sal fina')).toBeInTheDocument();
  });

  it('"Activar Artículo" button is visible when editing an inactive articulo', async () => {
    renderWithProviders(<ArticulosPage />);

    await waitFor(() => {
      expect(screen.getByText('Harina 000')).toBeInTheDocument();
    });

    // Switch to inactivos
    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Levadura seca')).toBeInTheDocument();
    });

    const levaduraText = await screen.findByText('Levadura seca');
    const levaduraRow = levaduraText.closest('tr')!;
    const editBtn = within(levaduraRow).getByTitle('Editar');
    await userEvent.click(editBtn);

    expect(screen.getByRole('heading', { name: 'Editar Artículo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activar Artículo' })).toBeInTheDocument();
  });

  it('"Activar Artículo" button is NOT visible when editing an active articulo', async () => {
    renderWithProviders(<ArticulosPage />);

    await waitFor(() => {
      expect(screen.getByText('Harina 000')).toBeInTheDocument();
    });

    const harinaText = await screen.findByText('Harina 000');
    const harinaRow = harinaText.closest('tr')!;
    const editBtn = within(harinaRow).getByTitle('Editar');
    await userEvent.click(editBtn);

    expect(screen.getByRole('heading', { name: 'Editar Artículo' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Activar Artículo' })).not.toBeInTheDocument();
  });

  it('clicking "Activar Artículo" sends PUT with activo:true; on success, modal closes', async () => {
    let requestPayload: unknown = null;
    server.use(
      http.put('http://localhost:3000/api/articulos/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 4, ...(requestPayload as object) } });
      })
    );

    renderWithProviders(<ArticulosPage />);

    await waitFor(() => {
      expect(screen.getByText('Harina 000')).toBeInTheDocument();
    });

    // Switch to inactivos
    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Levadura seca')).toBeInTheDocument();
    });

    const levaduraText = await screen.findByText('Levadura seca');
    const levaduraRow = levaduraText.closest('tr')!;
    const editBtn = within(levaduraRow).getByTitle('Editar');
    await userEvent.click(editBtn);

    await userEvent.click(screen.getByRole('button', { name: 'Activar Artículo' }));

    await waitFor(() => {
      expect((requestPayload as Record<string, unknown>).activo).toBe(true);
      expect(screen.queryByRole('heading', { name: 'Editar Artículo' })).not.toBeInTheDocument();
    });
  });

  it('editing and clearing descripcion sends PUT with descripcion: null (not empty string)', async () => {
    let requestPayload: unknown = null;
    server.use(
      http.put('http://localhost:3000/api/articulos/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 1, ...(requestPayload as object) } });
      })
    );

    renderWithProviders(<ArticulosPage />);

    await waitFor(() => {
      expect(screen.getByText('Harina 000')).toBeInTheDocument();
    });

    const harinaText = await screen.findByText('Harina 000');
    const harinaRow = harinaText.closest('tr')!;
    await userEvent.click(within(harinaRow).getByTitle('Editar'));

    const textarea = screen.getByRole('textbox', { name: /descripción/i });
    await userEvent.clear(textarea);

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect((requestPayload as Record<string, unknown>).descripcion).toBeNull();
    });
  });

  it('editing and clearing descripcion on an inactive articulo sends PUT with descripcion: null', async () => {
    let requestPayload: unknown = null;
    server.use(
      http.put('http://localhost:3000/api/articulos/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 4, ...(requestPayload as object) } });
      })
    );

    renderWithProviders(<ArticulosPage />);

    await waitFor(() => {
      expect(screen.getByText('Harina 000')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Levadura seca')).toBeInTheDocument();
    });

    const levaduraText = await screen.findByText('Levadura seca');
    const levaduraRow = levaduraText.closest('tr')!;
    await userEvent.click(within(levaduraRow).getByTitle('Editar'));

    const textarea = screen.getByRole('textbox', { name: /descripción/i });
    await userEvent.clear(textarea);

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect((requestPayload as Record<string, unknown>).descripcion).toBeNull();
    });
  });

  it('envelope is unwrapped correctly — row count matches mock length', async () => {
    renderWithProviders(<ArticulosPage />);

    await waitFor(() => {
      // +1 for the header row
      expect(screen.getAllByRole('row').length).toBe(articulosMock.length + 1);
    });
  });

  describe('error dialog on mutation failure', () => {
    it('shows an alertdialog with the API error message when creating fails', async () => {
      server.use(
        http.post('http://localhost:3000/api/articulos', () =>
          HttpResponse.json(
            { success: false, error: { message: 'El nombre ya está en uso' } },
            { status: 400 }
          )
        )
      );

      renderWithProviders(<ArticulosPage />);

      await waitFor(() => {
        expect(screen.getByText('Harina 000')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /nuevo artículo/i }));

      await userEvent.type(screen.getByLabelText('Nombre'), 'Repetido');
      await userEvent.type(screen.getByLabelText('Marca'), 'Marca X');
      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText('No se pudo crear el artículo')).toBeInTheDocument();
      expect(within(dialog).getByText('El nombre ya está en uso')).toBeInTheDocument();

      // Dismissal: single "Aceptar" button, no true/false branching.
      await userEvent.click(within(dialog).getByRole('button', { name: 'Aceptar' }));
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

      // The underlying edit modal must remain open — only the error dialog closed.
      expect(screen.getByRole('heading', { name: 'Nuevo Artículo' })).toBeInTheDocument();
    });

    it('shows an alertdialog with the API error message when deleting fails', async () => {
      server.use(
        http.delete('http://localhost:3000/api/articulos/:id', () =>
          HttpResponse.json(
            { success: false, error: { message: 'No se puede eliminar: en uso' } },
            { status: 409 }
          )
        )
      );

      renderWithProviders(<ArticulosPage />);

      await waitFor(() => {
        expect(screen.getByText('Harina 000')).toBeInTheDocument();
      });

      const harinaText = await screen.findByText('Harina 000');
      const harinaRow = harinaText.closest('tr')!;
      await userEvent.click(within(harinaRow).getByTitle('Editar'));

      await userEvent.click(screen.getByRole('button', { name: /eliminar artículo/i }));

      const confirmDialog = await screen.findByRole('alertdialog');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }));

      const errorDialog = await screen.findByRole('alertdialog');
      expect(within(errorDialog).getByText('No se pudo eliminar el artículo')).toBeInTheDocument();
      expect(within(errorDialog).getByText('No se puede eliminar: en uso')).toBeInTheDocument();
    });
  });

  describe('delete confirm dialog (replaces window.confirm)', () => {
    it('clicking "Eliminar Artículo" opens a confirm dialog instead of window.confirm', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm');

      renderWithProviders(<ArticulosPage />);

      await waitFor(() => {
        expect(screen.getByText('Harina 000')).toBeInTheDocument();
      });

      const harinaText = await screen.findByText('Harina 000');
      const harinaRow = harinaText.closest('tr')!;
      await userEvent.click(within(harinaRow).getByTitle('Editar'));

      await userEvent.click(screen.getByRole('button', { name: /eliminar artículo/i }));

      const confirmDialog = await screen.findByRole('alertdialog');
      expect(confirmDialog).toHaveAccessibleName('¿Está seguro de eliminar este artículo?');
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('confirming the delete dialog sends the DELETE request and closes both dialogs', async () => {
      let deleteRequested = false;
      server.use(
        http.delete('http://localhost:3000/api/articulos/:id', () => {
          deleteRequested = true;
          return new HttpResponse(null, { status: 204 });
        })
      );

      renderWithProviders(<ArticulosPage />);

      await waitFor(() => {
        expect(screen.getByText('Harina 000')).toBeInTheDocument();
      });

      const harinaText = await screen.findByText('Harina 000');
      const harinaRow = harinaText.closest('tr')!;
      await userEvent.click(within(harinaRow).getByTitle('Editar'));

      await userEvent.click(screen.getByRole('button', { name: /eliminar artículo/i }));

      const confirmDialog = await screen.findByRole('alertdialog');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }));

      await waitFor(() => {
        expect(deleteRequested).toBe(true);
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Editar Artículo' })).not.toBeInTheDocument();
      });
    });

    it('cancelling the delete dialog does NOT send a DELETE request and keeps the edit modal open', async () => {
      let deleteRequested = false;
      server.use(
        http.delete('http://localhost:3000/api/articulos/:id', () => {
          deleteRequested = true;
          return new HttpResponse(null, { status: 204 });
        })
      );

      renderWithProviders(<ArticulosPage />);

      await waitFor(() => {
        expect(screen.getByText('Harina 000')).toBeInTheDocument();
      });

      const harinaText = await screen.findByText('Harina 000');
      const harinaRow = harinaText.closest('tr')!;
      await userEvent.click(within(harinaRow).getByTitle('Editar'));

      await userEvent.click(screen.getByRole('button', { name: /eliminar artículo/i }));

      const confirmDialog = await screen.findByRole('alertdialog');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Cancelar' }));

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
      expect(deleteRequested).toBe(false);
      expect(screen.getByRole('heading', { name: 'Editar Artículo' })).toBeInTheDocument();
    });
  });
});
