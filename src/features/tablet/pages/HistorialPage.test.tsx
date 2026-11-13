import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithAuth } from '../../../test/render';
import { HistorialPage } from './HistorialPage';
import { getHistorial, type HistorialResponse } from '../../../api/historial';
import { getArticulos } from '../../../api/articulos';

vi.mock('../../../api/historial', () => ({ getHistorial: vi.fn() }));
vi.mock('../../../api/lineas', () => ({
  getLinea: vi.fn().mockResolvedValue({ id: 1, nombre: 'Línea Envasado Norte', activo: true }),
}));
const { pageOf } = vi.hoisted(() => ({
  pageOf: <T,>(items: T[]) => ({ items, total: items.length, page: 1, pageSize: 20 }),
}));

vi.mock('../../../api/etapas', () => ({
  getEtapas: vi.fn().mockResolvedValue(
    pageOf([
      { id: 1, nombre: 'Mezcla' },
      { id: 2, nombre: 'Horneado' },
    ]),
  ),
  getEtapa: vi.fn(async (id: number) => ({ id, nombre: id === 1 ? 'Mezcla' : 'Horneado' })),
}));
vi.mock('../../../api/articulos', () => ({
  getArticulos: vi.fn().mockResolvedValue(
    pageOf([
      { id: 9, codigo: 'ALF-10', nombre: 'Alfajor Chico' },
      { id: 7, codigo: 'ALF-2', nombre: 'Alfajor Triple' },
    ]),
  ),
  getArticulo: vi.fn(async (id: number) => ({ id, codigo: 'ALF-2', nombre: 'Alfajor Triple' })),
}));

const user = { id: 3, legajo: 'O1', nombreUsuario: 'operario1', rol: 'operario' as const, puedeTomarMuestrasLibres: true };

const item = (id: number, estado: 'ok' | 'fuera_de_rango', over: Record<string, unknown> = {}) => ({
  id,
  timestamp: '2026-10-01T12:00:00Z',
  pesoNeto: 12.5,
  pesoIdeal: 12,
  pesoMinimo: 10,
  pesoMaximo: 14,
  estadoValidacion: estado,
  observacion: null,
  pasadaId: 1,
  etapa: { id: 1, nombre: 'Mezcla' },
  rutaPasada: { id: 1, nombre: 'Ruta A' },
  articulo: { id: 7, codigo: 'ALF-01', nombre: 'Alfajor Triple' },
  ...over,
});

const response = (over: Partial<HistorialResponse> = {}): HistorialResponse => ({
  items: [item(1, 'ok'), item(2, 'fuera_de_rango', { articulo: null, pasadaId: null })],
  total: 2,
  page: 1,
  pageSize: 20,
  kpis: { total: 2, ok: 1, fueraRango: 1, porcentajeOk: 50, porcentajeFueraRango: 50 },
  ...over,
});

const lastParams = () => vi.mocked(getHistorial).mock.calls.at(-1)![0];

describe('HistorialPage', () => {
  beforeEach(() => {
    vi.mocked(getHistorial).mockReset();
    vi.mocked(getHistorial).mockResolvedValue(response());
  });

  it('shows the KPIs on top and the list of muestras below', async () => {
    renderWithAuth(<HistorialPage />, { user });

    await waitFor(() => expect(screen.getByTestId('kpi-ok-pct')).toHaveTextContent('50%'));
    expect(screen.getByTestId('kpi-fuera-pct')).toHaveTextContent('50%');
    expect(screen.getByTestId('kpi-ok-count')).toHaveTextContent('1 de 2');

    const list = screen.getByRole('list', { name: 'Listado de muestras' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(list).getByText('ALF-01 — Alfajor Triple')).toBeInTheDocument();
    expect(within(list).getByText('Muestra libre')).toBeInTheDocument();
    expect(screen.queryByText('Tendencia')).not.toBeInTheDocument();
  });

  it('labels a muestra of a volumen etapa in L and the others in kg', async () => {
    vi.mocked(getHistorial).mockResolvedValue(
      response({
        items: [
          item(1, 'ok', { pesoNeto: 0.06, magnitud: 'volumen' }),
          item(2, 'ok', { pesoNeto: 0.085, magnitud: 'peso' }),
          item(3, 'ok', { pesoNeto: 0.07 }),
        ],
        total: 3,
      }),
    );
    renderWithAuth(<HistorialPage />, { user });

    const list = await screen.findByRole('list', { name: 'Listado de muestras' });
    expect(await within(list).findByText('0.0600 L')).toBeInTheDocument();
    expect(within(list).getByText('0.0850 kg')).toBeInTheDocument();
    expect(within(list).getByText('0.0700 kg')).toBeInTheDocument();
  });

  it('hides the observación behind a clickable card that toggles it inline, only when the muestra has one', async () => {
    vi.mocked(getHistorial).mockResolvedValue(
      response({ items: [item(1, 'ok', { observacion: 'Masa pegajosa' }), item(2, 'ok', { articulo: null })] }),
    );
    renderWithAuth(<HistorialPage />, { user });

    const card = await screen.findByRole('button', { name: /ALF-01 — Alfajor Triple/ });
    expect(card).toHaveAttribute('aria-expanded', 'false');
    expect(card).toHaveTextContent('Tiene observación');
    expect(screen.queryByText('Masa pegajosa')).not.toBeInTheDocument();
    // the muestra without observación is not interactive
    expect(screen.getAllByRole('button', { name: /Muestra libre|ALF-01/ })).toHaveLength(1);

    await userEvent.click(card);
    expect(card).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Masa pegajosa')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(card);
    expect(card).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Masa pegajosa')).not.toBeInTheDocument();
  });

  it('tints each muestra green (ok) or red (fuera de rango) instead of showing a status badge', async () => {
    renderWithAuth(<HistorialPage />, { user });

    const list = within(await screen.findByRole('list', { name: 'Listado de muestras' }));
    const [ok, fuera] = list.getAllByRole('listitem');
    expect(ok).toHaveClass('bg-success/10');
    expect(fuera).toHaveClass('bg-destructive/10');
    expect(list.queryByText('OK')).not.toBeInTheDocument();
    expect(list.queryByText('Fuera de rango')).not.toBeInTheDocument();
    // the state is still announced to assistive tech, not only by color
    expect(ok).toHaveTextContent('Estado: OK');
    expect(fuera).toHaveTextContent('Estado: fuera de rango');
  });

  it('shows "Sin datos" and an empty message for an empty set', async () => {
    vi.mocked(getHistorial).mockResolvedValue(
      response({ items: [], total: 0, kpis: { total: 0, ok: 0, fueraRango: 0, porcentajeOk: 0, porcentajeFueraRango: 0 } }),
    );
    renderWithAuth(<HistorialPage />, { user });

    expect(await screen.findByText('No hay muestras para los filtros elegidos.')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-ok-pct')).toHaveTextContent('Sin datos');
    expect(screen.getByTestId('kpi-fuera-pct')).toHaveTextContent('Sin datos');
  });

  it('requests the first page without a user id', async () => {
    renderWithAuth(<HistorialPage />, { user });

    await waitFor(() => expect(getHistorial).toHaveBeenCalled());
    expect(lastParams()).toMatchObject({ page: 1, pageSize: 20 });
    expect(lastParams()).not.toHaveProperty('usuarioId');
  });

  it('sends etapa, artículo and date filters and goes back to page 1', async () => {
    vi.mocked(getHistorial).mockResolvedValue(response({ total: 45 }));
    renderWithAuth(<HistorialPage />, { user });
    await screen.findByText('Página 1 de 3');

    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    await screen.findByText('Página 2 de 3');

    await userEvent.click(screen.getByRole('button', { name: 'Todas las etapas' }));
    await userEvent.click(screen.getByRole('option', { name: 'Horneado' }));
    await waitFor(() => expect(lastParams()).toMatchObject({ etapaId: 2, page: 1 }));

    await userEvent.click(screen.getByRole('button', { name: 'Todos los artículos' }));
    await userEvent.click(screen.getByRole('option', { name: '[ALF-2] Alfajor Triple' }));
    await waitFor(() => expect(lastParams()).toMatchObject({ etapaId: 2, articuloId: 7 }));

    await userEvent.type(screen.getByLabelText('Desde'), '2026-10-01');
    await waitFor(() => expect(lastParams()).toMatchObject({ desde: '2026-10-01' }));
  });

  it('uses the remote combobox for the selectors: server order, "[código] nombre", bounded page and clearable', async () => {
    renderWithAuth(<HistorialPage />, { user });

    await userEvent.click(await screen.findByRole('button', { name: 'Todos los artículos' }));
    expect(await screen.findByRole('option', { name: '[ALF-10] Alfajor Chico' })).toBeInTheDocument();
    // The server decides the order; the page no longer re-sorts the catalog (natural order is an open decision).
    expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual([
      '[ALF-10] Alfajor Chico',
      '[ALF-2] Alfajor Triple',
    ]);
    expect(getArticulos).toHaveBeenCalledWith({ q: '', page: 1, pageSize: 20 });
    await userEvent.click(screen.getByRole('option', { name: '[ALF-10] Alfajor Chico' }));
    await waitFor(() => expect(lastParams()).toMatchObject({ articuloId: 9 }));

    await userEvent.click(screen.getByRole('button', { name: '[ALF-10] Alfajor Chico' }));
    await userEvent.click(screen.getByRole('button', { name: 'Quitar selección' }));
    await waitFor(() => expect(lastParams()?.articuloId).toBeUndefined());
  });

  it('shows the línea name, the avatar, the switch and a logout button in the header', async () => {
    renderWithAuth(<HistorialPage />, { user, activeLineaId: 1 });

    expect(await screen.findByRole('heading', { level: 1, name: 'Línea Envasado Norte' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Usuario operario1' })).toBeInTheDocument();
    expect(screen.queryByText('operario1')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Vista de Planta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });

  it('sends the search term after typing and resets to page 1', async () => {
    vi.mocked(getHistorial).mockResolvedValue(response({ total: 45 }));
    renderWithAuth(<HistorialPage />, { user });
    await userEvent.click(await screen.findByRole('button', { name: 'Página siguiente' }));
    await screen.findByText('Página 2 de 3');

    await userEvent.type(screen.getByLabelText('Buscar'), 'alfajor');

    await waitFor(() => expect(lastParams()).toMatchObject({ q: 'alfajor', page: 1 }));
  });

  it('keeps the current page when the (unchanged) search debounce fires after mounting', async () => {
    vi.mocked(getHistorial).mockResolvedValue(response({ total: 45 }));
    renderWithAuth(<HistorialPage />, { user });
    await userEvent.click(await screen.findByRole('button', { name: 'Página siguiente' }));
    await screen.findByText('Página 2 de 3');

    // the debounce is 300 ms: wait past it without touching the search box
    await new Promise(resolve => setTimeout(resolve, 450));

    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
  });

  it('paginates: next/previous buttons and disabled bounds', async () => {
    vi.mocked(getHistorial).mockResolvedValue(response({ total: 45 }));
    renderWithAuth(<HistorialPage />, { user });

    await screen.findByText('Página 1 de 3');
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    await waitFor(() => expect(lastParams()).toMatchObject({ page: 2 }));

    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    await screen.findByText('Página 3 de 3');
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
  });
});
