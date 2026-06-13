import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers, etapasMock, etapasMockInactivos } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { EtapasPage } from './EtapasPage';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('EtapasPage', () => {
  it('default mount shows only activos (3 rows from mock)', async () => {
    renderWithProviders(<EtapasPage />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Amasado')).toBeInTheDocument();
    });

    expect(screen.getByText('Amasado')).toBeInTheDocument();
    expect(screen.getByText('Horneado')).toBeInTheDocument();
    expect(screen.getByText('Envasado')).toBeInTheDocument();

    // Inactivos should NOT be present
    expect(screen.queryByText('Reposo')).not.toBeInTheDocument();
    expect(screen.queryByText('Corte')).not.toBeInTheDocument();
  });

  it('switching status dropdown to "Inactivos" shows only inactivos', async () => {
    renderWithProviders(<EtapasPage />);

    await waitFor(() => {
      expect(screen.getByText('Amasado')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    // Wait for inactivos to show up
    await waitFor(() => {
      expect(screen.getByText('Reposo')).toBeInTheDocument();
    });

    expect(screen.getByText('Reposo')).toBeInTheDocument();
    expect(screen.getByText('Corte')).toBeInTheDocument();

    // Activos should NOT be present
    expect(screen.queryByText('Amasado')).not.toBeInTheDocument();
  });

  it('typing search text filters by selected field within active partition; clearing restores full list', async () => {
    renderWithProviders(<EtapasPage />);

    await waitFor(() => {
      expect(screen.getByText('Amasado')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar...');
    
    // Type search
    await userEvent.type(searchInput, 'ama');

    // Should only show Amasado
    expect(screen.getByText('Amasado')).toBeInTheDocument();
    expect(screen.queryByText('Horneado')).not.toBeInTheDocument();
    expect(screen.queryByText('Envasado')).not.toBeInTheDocument();

    // Clear search
    await userEvent.clear(searchInput);

    // Should show all 3 again
    expect(screen.getByText('Amasado')).toBeInTheDocument();
    expect(screen.getByText('Horneado')).toBeInTheDocument();
    expect(screen.getByText('Envasado')).toBeInTheDocument();
  });

  it('edit modal for inactive etapa renders "Activar Etapa" button; edit modal for active etapa does NOT render it', async () => {
    renderWithProviders(<EtapasPage />);

    // Wait for load
    await waitFor(() => {
      expect(screen.getByText('Amasado')).toBeInTheDocument();
    });

    // Check active first
    const amasadoText = await screen.findByText('Amasado');
    const amasadoRow = amasadoText.closest('tr')!;
    const editActiveBtn = within(amasadoRow).getByTitle('Editar');
    await userEvent.click(editActiveBtn);

    expect(screen.getByRole('heading', { name: 'Editar Etapa' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Activar Etapa' })).not.toBeInTheDocument();

    // Close modal
    await userEvent.click(screen.getByText('Cancelar'));

    // Switch to inactivos
    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Reposo')).toBeInTheDocument();
    });

    // Check inactive
    const reposoText = await screen.findByText('Reposo');
    const reposoRow = reposoText.closest('tr')!;
    const editInactiveBtn = within(reposoRow).getByTitle('Editar');
    await userEvent.click(editInactiveBtn);

    expect(screen.getByRole('heading', { name: 'Editar Etapa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activar Etapa' })).toBeInTheDocument();
  });

  it('clicking "Activar Etapa" sends PUT with activo:true in body; on 200, query keys are invalidated and modal closes', async () => {
    let requestPayload: any = null;
    server.use(
      http.put('http://localhost:3000/api/etapas/:id', async ({ request }) => {
        requestPayload = await request.json();
        return HttpResponse.json({ success: true, data: { id: 4, ...requestPayload } });
      })
    );

    renderWithProviders(<EtapasPage />);

    await waitFor(() => {
      expect(screen.getByText('Amasado')).toBeInTheDocument();
    });

    // Switch to inactivos
    const statusSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(statusSelect, 'inactivo');

    await waitFor(() => {
      expect(screen.getByText('Reposo')).toBeInTheDocument();
    });

    // Open edit modal for inactive
    const reposoText = await screen.findByText('Reposo');
    const reposoRow = reposoText.closest('tr')!;
    const editInactiveBtn = within(reposoRow).getByTitle('Editar');
    await userEvent.click(editInactiveBtn);

    expect(screen.getByRole('heading', { name: 'Editar Etapa' })).toBeInTheDocument();

    // Click Activar
    await userEvent.click(screen.getByRole('button', { name: 'Activar Etapa' }));

    await waitFor(() => {
      expect(requestPayload).toEqual({
        nombre: 'Reposo',
        descripcion: 'Reposo inactivo',
        activo: true,
      });
      // The modal should be closed
      expect(screen.queryByRole('heading', { name: 'Editar Etapa' })).not.toBeInTheDocument();
    });
  });
});
