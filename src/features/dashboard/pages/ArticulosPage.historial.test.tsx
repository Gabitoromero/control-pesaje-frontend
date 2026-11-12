import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { ArticulosPage } from './ArticulosPage';

let requestedUrl: URL | null = null;
const server = setupServer(
  ...handlers,
  http.get('*/historial-cambios', ({ request }) => {
    requestedUrl = new URL(request.url);
    return HttpResponse.json({
      success: true,
      data: {
        items: [
          {
            id: 1, entidad: 'articulo', entidadId: 1, raizTipo: 'articulo', raizId: 1, accion: 'editar',
            fecha: '2026-11-12T13:00:00.000Z', antes: { nombre: 'Viejo' }, despues: { nombre: 'MarcaA' },
            usuario: { id: 2, nombreApellido: 'José Jefe', nombreUsuario: 'jefe1' },
          },
        ],
        total: 1, page: 1, pageSize: 20,
      },
    });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ArticulosPage history', () => {
  it('opens the change history of the selected articulo', async () => {
    renderWithProviders(<ArticulosPage />);
    await waitFor(() => expect(screen.getByText('Harina 000')).toBeInTheDocument());

    const row = screen.getByText('Harina 000').closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: 'Ver historial de cambios' }));

    expect(await screen.findByText('José Jefe (jefe1)')).toBeInTheDocument();
    expect(requestedUrl?.searchParams.get('raizTipo')).toBe('articulo');
    expect(requestedUrl?.searchParams.get('raizId')).toBe('1');
  });
});
