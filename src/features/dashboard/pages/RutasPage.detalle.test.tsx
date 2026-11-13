import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';
import { handlers } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { RutasPage } from './RutasPage';
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

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
            id: 1, entidad: 'ruta', entidadId: 1, raizTipo: 'ruta', raizId: 1, accion: 'editar',
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

describe('RutasPage detail drawer', () => {
  it('shows every field in full without opening the edit form, then jumps to the history', async () => {
    renderWithProviders(<RutasPage />);
    await waitFor(() => expect(screen.getByText('Ruta Alpha')).toBeInTheDocument());

    const row = screen.getByText('Ruta Alpha').closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: 'Ver detalle' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Detalle de la ruta')).toBeInTheDocument();
    expect(within(dialog).getAllByText('Ruta Alpha')).toHaveLength(2);
    expect(within(dialog).getByText('Descripción Alpha')).toBeInTheDocument();
    expect(within(dialog).getByText('Activa')).toBeInTheDocument();
    expect(screen.queryByText('Editar Ruta')).not.toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: /historial/i }));
    expect(await screen.findByText('José Jefe')).toBeInTheDocument();
    expect(requestedUrl?.searchParams.get('raizTipo')).toBe('ruta');
    expect(requestedUrl?.searchParams.get('raizId')).toBe('1');
  });
});
