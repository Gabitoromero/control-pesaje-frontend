import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers, articulosMock } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { ArticulosPage } from './ArticulosPage';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ArticulosPage', () => {
  it('muestra la lista de artículos al cargar', async () => {
    renderWithProviders(<ArticulosPage />);

    await waitFor(() => {
      expect(screen.getByText('ART-001')).toBeInTheDocument();
      expect(screen.getByText('ART-002')).toBeInTheDocument();
      expect(screen.getByText('ART-003')).toBeInTheDocument();
    });

    expect(screen.getByText('Harina 000')).toBeInTheDocument();
    expect(screen.getByText('Azúcar')).toBeInTheDocument();
  });

  it('muestra mensaje de error cuando falla la carga', async () => {
    server.use(
      http.get('http://localhost:3000/api/articulos', () =>
        HttpResponse.json({ success: false }, { status: 500 })
      )
    );

    renderWithProviders(<ArticulosPage />);

    await screen.findByText(/error al cargar artículos/i);
  });

  it('muestra estado vacío cuando no hay artículos', async () => {
    server.use(
      http.get('http://localhost:3000/api/articulos', () =>
        HttpResponse.json({ success: true, data: [] })
      )
    );

    renderWithProviders(<ArticulosPage />);

    await screen.findByText(/no hay artículos registrados/i);
  });

  it('abre el modal al hacer click en Nuevo Artículo', async () => {
    renderWithProviders(<ArticulosPage />);
    await screen.findByText('ART-001');

    await userEvent.click(screen.getByRole('button', { name: /nuevo artículo/i }));

    expect(screen.getByRole('heading', { name: 'Nuevo Artículo' })).toBeInTheDocument();
  });

  it('cierra el modal al hacer click en Cancelar', async () => {
    renderWithProviders(<ArticulosPage />);
    await screen.findByText('ART-001');

    await userEvent.click(screen.getByRole('button', { name: /nuevo artículo/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(screen.queryByRole('heading', { name: 'Nuevo Artículo' })).not.toBeInTheDocument();
  });

  it('pre-rellena el formulario al editar un artículo existente', async () => {
    renderWithProviders(<ArticulosPage />);
    await screen.findByText('ART-001');

    const row = screen.getByText('ART-001').closest('tr')!;
    await userEvent.click(within(row).getByTitle('Editar'));

    expect(screen.getByRole('heading', { name: 'Editar Artículo' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('ART-001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Harina 000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Harina de trigo tipo 000')).toBeInTheDocument();
  });

  it('crea un artículo nuevo al enviar el formulario', async () => {
    renderWithProviders(<ArticulosPage />);
    await screen.findByText('ART-001');

    await userEvent.click(screen.getByRole('button', { name: /nuevo artículo/i }));

    await userEvent.type(screen.getByLabelText(/código/i), 'ART-099');
    await userEvent.type(screen.getByLabelText(/nombre/i), 'Nuevo producto');
    await userEvent.type(screen.getByLabelText(/marca/i), 'Nueva Marca');

    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Nuevo Artículo' })).not.toBeInTheDocument()
    );
  });

  it('actualiza un artículo existente al enviar el formulario de edición', async () => {
    renderWithProviders(<ArticulosPage />);
    await screen.findByText('ART-001');

    const row = screen.getByText('ART-001').closest('tr')!;
    await userEvent.click(within(row).getByTitle('Editar'));

    const nombreInput = screen.getByDisplayValue('Harina 000');
    await userEvent.clear(nombreInput);
    await userEvent.type(nombreInput, 'Harina 000 especial');

    const marcaInput = screen.getByLabelText(/marca/i);
    await userEvent.clear(marcaInput);
    await userEvent.type(marcaInput, 'Marca Editada');

    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Editar Artículo' })).not.toBeInTheDocument()
    );
  });

  it('elimina un artículo al confirmar el diálogo', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<ArticulosPage />);
    await screen.findByText('ART-001');

    const row = screen.getByText('ART-001').closest('tr')!;
    await userEvent.click(within(row).getByTitle('Eliminar'));

    expect(window.confirm).toHaveBeenCalledWith('¿Está seguro de eliminar este artículo?');

    vi.restoreAllMocks();
  });

  it('no elimina el artículo si el usuario cancela el diálogo', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    let deleteCalled = false;
    server.use(
      http.delete('http://localhost:3000/api/articulos/:id', () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderWithProviders(<ArticulosPage />);
    await screen.findByText('ART-001');

    const row = screen.getByText('ART-001').closest('tr')!;
    await userEvent.click(within(row).getByTitle('Eliminar'));

    expect(deleteCalled).toBe(false);

    vi.restoreAllMocks();
  });

  it('el envelope del backend se desenvuelve correctamente (data.data)', async () => {
    renderWithProviders(<ArticulosPage />);

    // Si articulos.ts no desenvuelve .data.data, this.map no sería función y el componente exploraría
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBe(articulosMock.length + 1); // +1 por el header
    });
  });
});
