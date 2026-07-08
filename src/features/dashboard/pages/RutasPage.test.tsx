import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
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

  it('wraps the table in a horizontal-scroll container so narrow viewports scroll instead of breaking the layout', async () => {
    renderWithProviders(<RutasPage />);
    await waitFor(() => {
      expect(screen.getByText('Ruta Alpha')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    const scrollWrapper = table.parentElement as HTMLElement;
    expect(scrollWrapper.className).toMatch(/overflow-x-auto/);
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




});
