import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers, rutasMock } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { RutasPage } from './RutasPage';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('RutasPage', () => {
  it('default mount shows only activos', async () => {
    renderWithProviders(<RutasPage />);

    await waitFor(() => {
      expect(screen.getByText('Ruta Alpha')).toBeInTheDocument();
    });

    expect(screen.getByText('Ruta Alpha')).toBeInTheDocument();
    expect(screen.getByText('Ruta Beta')).toBeInTheDocument();
    expect(screen.getByText('Ruta Gamma')).toBeInTheDocument();

    expect(screen.queryByText('Ruta Delta')).not.toBeInTheDocument();
    expect(screen.queryByText('Ruta Epsilon')).not.toBeInTheDocument();
  });

  it('switching to inactivos shows only inactivos', async () => {
    renderWithProviders(<RutasPage />);

    await waitFor(() => {
      expect(screen.getByText('Ruta Alpha')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Ruta Delta')).toBeInTheDocument();
    });

    expect(screen.getByText('Ruta Delta')).toBeInTheDocument();
    expect(screen.getByText('Ruta Epsilon')).toBeInTheDocument();

    expect(screen.queryByText('Ruta Alpha')).not.toBeInTheDocument();
    expect(screen.queryByText('Ruta Beta')).not.toBeInTheDocument();
    expect(screen.queryByText('Ruta Gamma')).not.toBeInTheDocument();
  });

  it('typing search text filters activos by nombre; clearing restores full list', async () => {
    renderWithProviders(<RutasPage />);

    await waitFor(() => {
      expect(screen.getByText('Ruta Alpha')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar...');

    await userEvent.type(searchInput, 'alpha');

    expect(screen.getByText('Ruta Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Ruta Beta')).not.toBeInTheDocument();
    expect(screen.queryByText('Ruta Gamma')).not.toBeInTheDocument();

    await userEvent.clear(searchInput);

    expect(screen.getByText('Ruta Alpha')).toBeInTheDocument();
    expect(screen.getByText('Ruta Beta')).toBeInTheDocument();
    expect(screen.getByText('Ruta Gamma')).toBeInTheDocument();
  });

  it('"Activar Ruta" button is visible when editing an inactive ruta', async () => {
    renderWithProviders(<RutasPage />);

    await waitFor(() => {
      expect(screen.getByText('Ruta Alpha')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Ruta Delta')).toBeInTheDocument();
    });

    const deltaText = await screen.findByText('Ruta Delta');
    const deltaRow = deltaText.closest('tr')!;
    await userEvent.click(within(deltaRow).getByTitle('Editar'));

    expect(screen.getByRole('heading', { name: 'Editar Ruta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activar Ruta' })).toBeInTheDocument();
  });

  it('"Activar Ruta" button is NOT visible when editing an active ruta', async () => {
    renderWithProviders(<RutasPage />);

    await waitFor(() => {
      expect(screen.getByText('Ruta Alpha')).toBeInTheDocument();
    });

    const alphaText = await screen.findByText('Ruta Alpha');
    const alphaRow = alphaText.closest('tr')!;
    await userEvent.click(within(alphaRow).getByTitle('Editar'));

    expect(screen.getByRole('heading', { name: 'Editar Ruta' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Activar Ruta' })).not.toBeInTheDocument();
  });

  it('clicking "Activar Ruta" sends PUT with activo:true; modal closes on success', async () => {
    let requestPayload: unknown = null;
    server.use(
      http.put('http://localhost:3000/api/rutas-pasadas/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 4, ...(requestPayload as object) } });
      })
    );

    renderWithProviders(<RutasPage />);

    await waitFor(() => {
      expect(screen.getByText('Ruta Alpha')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Ruta Delta')).toBeInTheDocument();
    });

    const deltaText = await screen.findByText('Ruta Delta');
    const deltaRow = deltaText.closest('tr')!;
    await userEvent.click(within(deltaRow).getByTitle('Editar'));

    await userEvent.click(screen.getByRole('button', { name: 'Activar Ruta' }));

    await waitFor(() => {
      expect((requestPayload as Record<string, unknown>).activo).toBe(true);
      expect(screen.queryByRole('heading', { name: 'Editar Ruta' })).not.toBeInTheDocument();
    });
  });

  it('editing and clearing descripcion on an active ruta sends PUT with descripcion: null', async () => {
    let requestPayload: unknown = null;
    server.use(
      http.put('http://localhost:3000/api/rutas-pasadas/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 1, ...(requestPayload as object) } });
      })
    );

    renderWithProviders(<RutasPage />);

    await waitFor(() => {
      expect(screen.getByText('Ruta Alpha')).toBeInTheDocument();
    });

    // rutasMock[0] is 'Ruta Alpha' which has descripcion: 'Descripción Alpha'
    const alphaText = await screen.findByText('Ruta Alpha');
    const alphaRow = alphaText.closest('tr')!;
    await userEvent.click(within(alphaRow).getByTitle('Editar'));

    const textarea = screen.getByRole('textbox', { name: /descripción/i });
    await userEvent.clear(textarea);

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect((requestPayload as Record<string, unknown>).descripcion).toBeNull();
    });
  });

  it('editing and clearing descripcion on an inactive ruta sends PUT with descripcion: null', async () => {
    let requestPayload: unknown = null;
    server.use(
      http.put('http://localhost:3000/api/rutas-pasadas/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 4, ...(requestPayload as object) } });
      })
    );

    renderWithProviders(<RutasPage />);

    await waitFor(() => {
      expect(screen.getByText('Ruta Alpha')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Ruta Delta')).toBeInTheDocument();
    });

    // rutasMockInactivos[0] is 'Ruta Delta' which has descripcion: 'Ruta inactiva D'
    const deltaText = await screen.findByText('Ruta Delta');
    const deltaRow = deltaText.closest('tr')!;
    await userEvent.click(within(deltaRow).getByTitle('Editar'));

    const textarea = screen.getByRole('textbox', { name: /descripción/i });
    await userEvent.clear(textarea);

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect((requestPayload as Record<string, unknown>).descripcion).toBeNull();
    });
  });

  it('row count matches mock length', async () => {
    renderWithProviders(<RutasPage />);

    await waitFor(() => {
      // +1 for the header row
      expect(screen.getAllByRole('row').length).toBe(rutasMock.length + 1);
    });
  });
});
