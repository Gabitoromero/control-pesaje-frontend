import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers, articulosMock, articulosMockInactivos } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { ArticulosPage } from './ArticulosPage';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
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

  it('envelope is unwrapped correctly — row count matches mock length', async () => {
    renderWithProviders(<ArticulosPage />);

    await waitFor(() => {
      // +1 for the header row
      expect(screen.getAllByRole('row').length).toBe(articulosMock.length + 1);
    });
  });
});
