import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers, pagedJson } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { LineasPage } from './LineasPage';

let requestedUrl: URL | null = null;
const server = setupServer(
  http.get('*/lineas-produccion', ({ request }) =>
    pagedJson(request, [{
        id: 7, nombre: 'Línea Detalle', estado: 'disponible', activo: true, idBalanza: 1, articuloId: 1,
        observacion: 'Revisar la celda de carga cada turno',
        dispositivo: { hardwareId: 'abcdef1234567890', nombre: 'Tablet Norte', ultimaConexionAt: null },
        rutaPasadaActiva: { id: 1, nombre: 'Ruta Alpha', descripcion: null, activo: true, etapas: [] },
      }]),
  ),
  ...handlers,
  http.get('*/historial-cambios', ({ request }) => {
    requestedUrl = new URL(request.url);
    return HttpResponse.json({
      success: true,
      data: {
        items: [
          {
            id: 1, entidad: 'linea', entidadId: 7, raizTipo: 'linea', raizId: 7, accion: 'editar',
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

describe('LineasPage detail drawer', () => {
  it('shows every field in full without opening the edit form, then jumps to the history', async () => {
    renderWithProviders(<LineasPage />);
    await waitFor(() => expect(screen.getByText('Línea Detalle')).toBeInTheDocument());

    const row = screen.getByText('Línea Detalle').closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: 'Ver detalle' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Detalle de la línea')).toBeInTheDocument();
    expect(within(dialog).getAllByText('Línea Detalle')).toHaveLength(1);
    expect(within(dialog).getByText('Tablet Norte (abcdef1234567890)')).toBeInTheDocument();
    expect(within(dialog).getByText('Ruta Alpha')).toBeInTheDocument();
    expect(within(dialog).getByText('Revisar la celda de carga cada turno')).toBeInTheDocument();
    expect(within(dialog).getByText('Activa')).toBeInTheDocument();
    expect(screen.queryByText('Editar Línea')).not.toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: /historial/i }));
    expect(await screen.findByText('José Jefe')).toBeInTheDocument();
    expect(requestedUrl?.searchParams.get('raizTipo')).toBe('linea');
    expect(requestedUrl?.searchParams.get('raizId')).toBe('7');
  });
});
