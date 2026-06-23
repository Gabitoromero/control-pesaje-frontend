import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers, rutasMock } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { RutasPage } from './RutasPage';
import { vi } from 'vitest';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => {
  navigateMock.mockClear();
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

describe('RutasPage', () => {
  it('default mount shows only activos', async () => {
    renderWithProviders(<RutasPage />);
    await waitFor(() => {
      expect(screen.getByText('Ruta Alpha')).toBeInTheDocument();
    });
    expect(screen.getByText('Ruta Beta')).toBeInTheDocument();
    expect(screen.getByText('Ruta Gamma')).toBeInTheDocument();
    expect(screen.queryByText('Ruta Delta')).not.toBeInTheDocument();
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
    expect(screen.getByText('Ruta Epsilon')).toBeInTheDocument();
    expect(screen.queryByText('Ruta Alpha')).not.toBeInTheDocument();
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
    await userEvent.clear(searchInput);
    expect(screen.getByText('Ruta Beta')).toBeInTheDocument();
  });

  it('row count matches mock length', async () => {
    renderWithProviders(<RutasPage />);
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBe(rutasMock.length + 1);
    });
  });

  it('"Nueva Ruta" calls navigate', async () => {
    renderWithProviders(<RutasPage />);
    await waitFor(() => {
      expect(screen.getByText('Ruta Alpha')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: /nueva ruta/i }));
    expect(navigateMock).toHaveBeenCalledWith('/dashboard/rutas/new');
  });

  it('row Edit icon calls navigate', async () => {
    renderWithProviders(<RutasPage />);
    await waitFor(() => {
      expect(screen.getByText('Ruta Alpha')).toBeInTheDocument();
    });
    const alphaText = await screen.findByText('Ruta Alpha');
    const alphaRow = alphaText.closest('tr')!;
    await userEvent.click(within(alphaRow).getByTitle('Editar'));
    expect(navigateMock).toHaveBeenCalledWith('/dashboard/rutas/1');
  });

  it('clicking Activar sends PUT with activo:true', async () => {
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
    await userEvent.click(within(deltaRow).getByTitle('Activar'));
    await waitFor(() => {
      expect((requestPayload as Record<string, unknown>).activo).toBe(true);
    });
  });

  it('delete fires on confirm / does not fire on cancel', async () => {
    let deleteFired = false;
    server.use(
      http.delete('http://localhost:3000/api/rutas-pasadas/:id', () => {
        deleteFired = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    renderWithProviders(<RutasPage />);
    await waitFor(() => {
      expect(screen.getByText('Ruta Alpha')).toBeInTheDocument();
    });

    const alphaText = await screen.findByText('Ruta Alpha');
    const alphaRow = alphaText.closest('tr')!;

    // Cancel delete
    const spy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await userEvent.click(within(alphaRow).getByTitle('Eliminar'));
    expect(spy).toHaveBeenCalled();
    expect(deleteFired).toBe(false);

    // Confirm delete
    spy.mockReturnValue(true);
    await userEvent.click(within(alphaRow).getByTitle('Eliminar'));
    await waitFor(() => {
      expect(deleteFired).toBe(true);
    });
  });
});
