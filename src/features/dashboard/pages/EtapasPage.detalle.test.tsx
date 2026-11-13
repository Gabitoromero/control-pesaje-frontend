import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { EtapasPage } from './EtapasPage';

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
            id: 1, entidad: 'etapa', entidadId: 1, raizTipo: 'etapa', raizId: 1, accion: 'editar',
            fecha: '2026-11-12T13:00:00.000Z', antes: { nombre: 'Viejo' }, despues: { nombre: 'Nuevo' },
            usuario: { id: 2, nombreApellido: 'José Jefe', nombreUsuario: 'jefe1' },
          },
        ],
        total: 1, page: 1, pageSize: 20,
      },
    });
  }),
);

beforeAll(() => server.listen());
afterEach(() => { requestedUrl = null; server.resetHandlers(); });
afterAll(() => server.close());

describe('EtapasPage detail drawer', () => {
  it('shows every field in full without opening the edit form, then jumps to the history', async () => {
    renderWithProviders(<EtapasPage />);
    await waitFor(() => expect(screen.getByText('Amasado')).toBeInTheDocument());

    const row = screen.getByText('Amasado').closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: 'Ver detalle' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Detalle de la etapa')).toBeInTheDocument();
    expect(within(dialog).getAllByText('Amasado')).toHaveLength(1);
    expect(within(dialog).getByText('Proceso de amasado')).toBeInTheDocument();
    expect(within(dialog).getByText('Activa')).toBeInTheDocument();
    expect(screen.queryByText('Editar Etapa')).not.toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: /historial/i }));
    expect(await screen.findByText('José Jefe')).toBeInTheDocument();
    expect(requestedUrl?.searchParams.get('raizTipo')).toBe('etapa');
    expect(requestedUrl?.searchParams.get('raizId')).toBe('1');
  });
});
