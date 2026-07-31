import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';
import { handlers } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { BalanzasPage } from './BalanzasPage';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('BalanzasPage', () => {
  it('default mount shows only activas (2 rows from mock)', async () => {
    renderWithProviders(<BalanzasPage />);

    await waitFor(() => {
      expect(screen.getByText('Balanza 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Balanza 1')).toBeInTheDocument();
    expect(screen.getByText('Balanza 2')).toBeInTheDocument();

    // Inactivos should NOT be present
    expect(screen.queryByText('Balanza Vieja')).not.toBeInTheDocument();
  });

  it('switching status dropdown to "Inactivos" shows only inactivas', async () => {
    renderWithProviders(<BalanzasPage />);

    await waitFor(() => {
      expect(screen.getByText('Balanza 1')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Balanza Vieja')).toBeInTheDocument();
    });

    expect(screen.queryByText('Balanza 1')).not.toBeInTheDocument();
  });

  it('creating a new balanza shows a success toast with creation-specific copy', async () => {
    renderWithProviders(<BalanzasPage />);

    await waitFor(() => {
      expect(screen.getByText('Balanza 1')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Nueva Balanza/i }));
    await userEvent.type(screen.getByLabelText('Nombre'), 'Balanza 3');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      const liveRegion = document.querySelector('[aria-live]');
      expect(liveRegion).toBeInTheDocument();
      expect(within(liveRegion as HTMLElement).getByText('Balanza creada exitosamente')).toBeInTheDocument();
    });
  });

  it('editing an active balanza sends PUT with the new nombre and shows update toast', async () => {
    let requestPayload: unknown = null;
    server.use(
      http.put('http://localhost:3000/api/balanzas/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 1, ...(requestPayload as object) } });
      })
    );

    renderWithProviders(<BalanzasPage />);

    await waitFor(() => {
      expect(screen.getByText('Balanza 1')).toBeInTheDocument();
    });

    const row = (await screen.findByText('Balanza 1')).closest('tr')!;
    await userEvent.click(within(row).getByTitle('Editar'));

    const nombreInput = screen.getByLabelText('Nombre');
    await userEvent.clear(nombreInput);
    await userEvent.type(nombreInput, 'Balanza 1 Renombrada');

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect((requestPayload as Record<string, unknown>).nombre).toBe('Balanza 1 Renombrada');
      const liveRegion = document.querySelector('[aria-live]');
      expect(within(liveRegion as HTMLElement).getByText('Balanza actualizada exitosamente')).toBeInTheDocument();
    });
  });

  it('edit modal for inactive balanza renders "Activar Balanza" button; active does not', async () => {
    renderWithProviders(<BalanzasPage />);

    await waitFor(() => {
      expect(screen.getByText('Balanza 1')).toBeInTheDocument();
    });

    const activeRow = (await screen.findByText('Balanza 1')).closest('tr')!;
    await userEvent.click(within(activeRow).getByTitle('Editar'));
    expect(screen.queryByRole('button', { name: 'Activar Balanza' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Cancelar'));

    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'inactivo');
    await waitFor(() => expect(screen.getByText('Balanza Vieja')).toBeInTheDocument());

    const inactiveRow = (await screen.findByText('Balanza Vieja')).closest('tr')!;
    await userEvent.click(within(inactiveRow).getByTitle('Editar'));
    expect(screen.getByRole('button', { name: 'Activar Balanza' })).toBeInTheDocument();
  });

  describe('delete confirm dialog', () => {
    it('clicking "Eliminar Balanza" opens a confirm dialog instead of window.confirm', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm');

      renderWithProviders(<BalanzasPage />);

      await waitFor(() => {
        expect(screen.getByText('Balanza 1')).toBeInTheDocument();
      });

      const row = (await screen.findByText('Balanza 1')).closest('tr')!;
      await userEvent.click(within(row).getByTitle('Editar'));
      await userEvent.click(screen.getByRole('button', { name: /eliminar balanza/i }));

      const confirmDialog = await screen.findByRole('alertdialog');
      expect(confirmDialog).toHaveAccessibleName('¿Está seguro de eliminar esta balanza?');
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('confirming the delete dialog sends the DELETE request and closes both dialogs', async () => {
      let deleteRequested = false;
      server.use(
        http.delete('http://localhost:3000/api/balanzas/:id', () => {
          deleteRequested = true;
          return new HttpResponse(null, { status: 204 });
        })
      );

      renderWithProviders(<BalanzasPage />);

      await waitFor(() => {
        expect(screen.getByText('Balanza 1')).toBeInTheDocument();
      });

      const row = (await screen.findByText('Balanza 1')).closest('tr')!;
      await userEvent.click(within(row).getByTitle('Editar'));
      await userEvent.click(screen.getByRole('button', { name: /eliminar balanza/i }));

      const confirmDialog = await screen.findByRole('alertdialog');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }));

      await waitFor(() => {
        expect(deleteRequested).toBe(true);
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Editar Balanza' })).not.toBeInTheDocument();
      });
    });
  });

  describe('RestrictError surfacing on blocked delete', () => {
    it('delete failure (in-use balanza) shows alertdialog with backend message + Spanish operator note', async () => {
      server.use(
        http.delete('http://localhost:3000/api/balanzas/:id', () =>
          HttpResponse.json(
            { success: false, error: { message: 'Cannot delete balanza 1: 2 linea(s) reference it' } },
            { status: 400 }
          )
        )
      );

      renderWithProviders(<BalanzasPage />);

      await waitFor(() => {
        expect(screen.getByText('Balanza 1')).toBeInTheDocument();
      });

      const row = (await screen.findByText('Balanza 1')).closest('tr')!;
      await userEvent.click(within(row).getByTitle('Editar'));
      await userEvent.click(screen.getByRole('button', { name: /eliminar balanza/i }));

      const confirmDialog = await screen.findByRole('alertdialog');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }));

      const errorDialog = await screen.findByRole('alertdialog');
      expect(within(errorDialog).getByText('No se pudo eliminar la balanza')).toBeInTheDocument();
      expect(within(errorDialog).getByText(/Cannot delete balanza 1/)).toBeInTheDocument();
      expect(within(errorDialog).getByText(/No podés eliminar una balanza que está asignada a una línea o usada en pasadas/)).toBeInTheDocument();
    });
  });
});
