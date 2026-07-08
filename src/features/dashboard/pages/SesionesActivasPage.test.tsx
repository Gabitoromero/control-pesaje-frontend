import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';
import { handlers } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { SesionesActivasPage } from './SesionesActivasPage';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

describe('SesionesActivasPage', () => {
  it('shows active sessions from the API', async () => {
    renderWithProviders(<SesionesActivasPage />);

    await waitFor(() => {
      expect(screen.getByText('Pedro Operario')).toBeInTheDocument();
    });

    expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    expect(screen.getByText('333333')).toBeInTheDocument();
  });

  it('wraps the table in a horizontal-scroll container so narrow viewports scroll instead of breaking the layout', async () => {
    renderWithProviders(<SesionesActivasPage />);

    await waitFor(() => {
      expect(screen.getByText('Pedro Operario')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    const scrollWrapper = table.parentElement as HTMLElement;
    expect(scrollWrapper.className).toMatch(/overflow-x-auto/);
  });

  describe('close session confirm dialog (replaces window.confirm)', () => {
    it('clicking "Cerrar sesión" opens a confirm dialog instead of window.confirm', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm');

      renderWithProviders(<SesionesActivasPage />);

      await waitFor(() => {
        expect(screen.getByText('Pedro Operario')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTitle('Cerrar sesión'));

      const confirmDialog = await screen.findByRole('alertdialog');
      expect(confirmDialog).toHaveAccessibleName(
        '¿Estás seguro de que deseas cerrar la sesión de Pedro Operario en Línea 1 — Envasado A?'
      );
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('confirming the dialog sends the close-session request and closes the dialog', async () => {
      let closeRequested = false;
      server.use(
        http.post('http://localhost:3000/api/auth/cerrar-sesion', () => {
          closeRequested = true;
          return HttpResponse.json({ success: true, data: {} });
        })
      );

      renderWithProviders(<SesionesActivasPage />);

      await waitFor(() => {
        expect(screen.getByText('Pedro Operario')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTitle('Cerrar sesión'));

      const confirmDialog = await screen.findByRole('alertdialog');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Cerrar sesión' }));

      await waitFor(() => {
        expect(closeRequested).toBe(true);
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });

    it('cancelling the dialog does NOT send the close-session request', async () => {
      let closeRequested = false;
      server.use(
        http.post('http://localhost:3000/api/auth/cerrar-sesion', () => {
          closeRequested = true;
          return HttpResponse.json({ success: true, data: {} });
        })
      );

      renderWithProviders(<SesionesActivasPage />);

      await waitFor(() => {
        expect(screen.getByText('Pedro Operario')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTitle('Cerrar sesión'));

      const confirmDialog = await screen.findByRole('alertdialog');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Cancelar' }));

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
      expect(closeRequested).toBe(false);
      expect(screen.getByText('Pedro Operario')).toBeInTheDocument();
    });
  });

  describe('error dialog on mutation failure', () => {
    it('shows an alertdialog with the API error message when closing a session fails', async () => {
      server.use(
        http.post('http://localhost:3000/api/auth/cerrar-sesion', () =>
          HttpResponse.json(
            { success: false, error: { message: 'La sesión ya no existe' } },
            { status: 500 }
          )
        )
      );

      renderWithProviders(<SesionesActivasPage />);

      await waitFor(() => {
        expect(screen.getByText('Pedro Operario')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTitle('Cerrar sesión'));

      const confirmDialog = await screen.findByRole('alertdialog');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Cerrar sesión' }));

      const errorDialog = await screen.findByRole('alertdialog');
      expect(within(errorDialog).getByText('No se pudo cerrar la sesión')).toBeInTheDocument();
      expect(within(errorDialog).getByText('La sesión ya no existe')).toBeInTheDocument();

      await userEvent.click(within(errorDialog).getByRole('button', { name: 'Aceptar' }));
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(screen.getByText('Pedro Operario')).toBeInTheDocument();
    });
  });
});
