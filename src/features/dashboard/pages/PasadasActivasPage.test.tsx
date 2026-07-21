import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';
import { handlers } from '../../../test/handlers';
import { mockMatchMedia } from '../../../test/setup';
import { renderWithProviders } from '../../../test/render';
import { PasadasActivasPage } from './PasadasActivasPage';

const BASE = 'http://localhost:3000/api';

function setMatchMediaFor(queries: Record<string, boolean>) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: queries[query] ?? false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

const pasadasActivasMock = [
  {
    id: 10,
    lineaProduccionId: 1,
    usuarioId: 3,
    articuloId: 1,
    estado: 'en_curso',
    horaInicio: '2026-07-08T10:00:00.000Z',
    lineaProduccion: { id: 1, nombre: 'Línea 1 — Envasado A' },
    usuario: { id: 3, nombreApellido: 'Pedro Operario', nombreUsuario: 'operario1' },
    articulo: { id: 1, nombre: 'Harina 000' },
  },
];

const server = setupServer(
  ...handlers,
  http.get(`${BASE}/pasadas`, () =>
    HttpResponse.json({ success: true, data: pasadasActivasMock })
  )
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
  // Restore a wide-screen default so existing assertions (all columns visible)
  // are not affected by responsive hiding after each test mutates matchMedia.
  mockMatchMedia(true);
});
afterAll(() => server.close());

// Existing tests assume a wide screen where every column is visible.
mockMatchMedia(true);

describe('PasadasActivasPage', () => {
  it('renders pasadas from the API with línea, operario, artículo and hora de inicio', async () => {
    renderWithProviders(<PasadasActivasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    expect(screen.getByText('Pedro Operario')).toBeInTheDocument();
    expect(screen.getByText('Harina 000')).toBeInTheDocument();
  });

  it('shows an empty state when there are no active pasadas', async () => {
    server.use(
      http.get(`${BASE}/pasadas`, () => HttpResponse.json({ success: true, data: [] }))
    );

    renderWithProviders(<PasadasActivasPage />);

    await waitFor(() => {
      expect(screen.getByText(/no hay pasadas/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('clicking "Abortar Pasada" opens the confirm-with-reason dialog', async () => {
    renderWithProviders(<PasadasActivasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /abortar pasada/i }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('keeps the confirm button disabled until a reason is typed', async () => {
    renderWithProviders(<PasadasActivasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /abortar pasada/i }));

    const dialog = await screen.findByRole('dialog');
    const confirmButton = within(dialog).getByRole('button', { name: /confirmar/i });
    expect(confirmButton).toBeDisabled();

    await userEvent.type(within(dialog).getByRole('textbox'), 'Rotura de bolsa');
    expect(confirmButton).toBeEnabled();
  });

  it('a successful abort removes the row from the table', async () => {
    let requestBody: unknown = null;
    server.use(
      http.put(`${BASE}/pasadas/10`, async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({ success: true, data: { ...pasadasActivasMock[0], estado: 'abortada' } });
      })
    );

    renderWithProviders(<PasadasActivasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /abortar pasada/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByRole('textbox'), 'Rotura de bolsa');

    server.use(
      http.get(`${BASE}/pasadas`, () => HttpResponse.json({ success: true, data: [] }))
    );

    await userEvent.click(within(dialog).getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(requestBody).toEqual({ action: 'abortar', motivoCierre: 'Rotura de bolsa' });
    });
    await waitFor(() => {
      expect(screen.queryByText('Línea 1 — Envasado A')).not.toBeInTheDocument();
    });
  });

  it('shows an error dialog with the API error message when the abort call fails', async () => {
    server.use(
      http.put(`${BASE}/pasadas/10`, () =>
        HttpResponse.json(
          { success: false, error: { message: 'La pasada ya no está en curso' } },
          { status: 400 }
        )
      )
    );

    renderWithProviders(<PasadasActivasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /abortar pasada/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByRole('textbox'), 'Rotura de bolsa');
    await userEvent.click(within(dialog).getByRole('button', { name: /confirmar/i }));

    const errorDialog = await screen.findByRole('alertdialog');
    expect(within(errorDialog).getByText('La pasada ya no está en curso')).toBeInTheDocument();

    expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
  });
  it('renders em-dash fallbacks when lineaProduccion, usuario and articulo relations are null', async () => {
    server.use(
      http.get(`${BASE}/pasadas`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              id: 99,
              lineaProduccionId: null,
              usuarioId: null,
              articuloId: null,
              estado: 'en_curso',
              horaInicio: '2026-07-08T10:00:00.000Z',
              lineaProduccion: null,
              usuario: null,
              articulo: null,
            },
          ],
        })
      )
    );

    renderWithProviders(<PasadasActivasPage />);

    await waitFor(() => {
      // Each null relation column should show an em-dash instead of crashing
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('shows a specific message when the abort fails because the run was already aborted by another session', async () => {
    server.use(
      http.put(`${BASE}/pasadas/10`, () =>
        HttpResponse.json(
          { success: false, error: { message: 'La pasada ya no está en curso' } },
          { status: 400 }
        )
      )
    );

    renderWithProviders(<PasadasActivasPage />);

    await waitFor(() => {
      expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /abortar pasada/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByRole('textbox'), 'Error de sistema');
    await userEvent.click(within(dialog).getByRole('button', { name: /confirmar/i }));

    // The error dialog must surface the backend message so the operator knows
    // it was already aborted by another admin session (race condition)
    const errorDialog = await screen.findByRole('alertdialog');
    expect(within(errorDialog).getByText('La pasada ya no está en curso')).toBeInTheDocument();

    // Row must still be visible (the UI doesn't optimistically remove it)
    expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
  });

  describe('columnas responsivas', () => {
    it('oculta la columna Artículo en viewports < 1024px pero mantiene Estado (≥768px)', async () => {
      setMatchMediaFor({
        '(min-width: 1024px)': false,
        '(min-width: 768px)': true,
      });

      renderWithProviders(<PasadasActivasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      // Artículo column is hidden below 1024px
      expect(screen.queryByText('Artículo')).not.toBeInTheDocument();
      expect(screen.queryByText('Harina 000')).not.toBeInTheDocument();

      // Estado column stays visible at 768px+
      expect(screen.getByText('Hora de Inicio')).toBeInTheDocument();
    });

    it('oculta también la columna Estado en viewports < 768px', async () => {
      setMatchMediaFor({
        '(min-width: 1024px)': false,
        '(min-width: 768px)': false,
      });

      renderWithProviders(<PasadasActivasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      expect(screen.queryByText('Artículo')).not.toBeInTheDocument();
      expect(screen.queryByText('Estado')).not.toBeInTheDocument();
      expect(screen.queryByText('En curso')).not.toBeInTheDocument();
    });

    it('muestra todas las columnas en viewports ≥ 1024px', async () => {
      setMatchMediaFor({
        '(min-width: 1024px)': true,
        '(min-width: 768px)': true,
      });

      renderWithProviders(<PasadasActivasPage />);

      await waitFor(() => {
        expect(screen.getByText('Línea 1 — Envasado A')).toBeInTheDocument();
      });

      expect(screen.getByText('Artículo')).toBeInTheDocument();
      expect(screen.getByText('Harina 000')).toBeInTheDocument();
      expect(screen.getByText('Estado')).toBeInTheDocument();
    });
  });
});
