import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithAuth } from '../../../test/render';
import { HistorialPage } from './HistorialPage';
import { getHistorial, type HistorialResponse } from '../../../api/historial';

vi.mock('../../../api/historial', () => ({ getHistorial: vi.fn() }));
vi.mock('../../../api/etapas', () => ({
  getEtapas: vi.fn().mockResolvedValue([
    { id: 1, nombre: 'Mezcla' },
    { id: 2, nombre: 'Horneado' },
  ]),
}));
vi.mock('../../../api/articulos', () => ({
  getArticulos: vi.fn().mockResolvedValue([{ id: 7, codigo: 'ALF-01', nombre: 'Alfajor Triple' }]),
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

    await userEvent.selectOptions(screen.getByLabelText('Etapa'), '2');
    await waitFor(() => expect(lastParams()).toMatchObject({ etapaId: 2, page: 1 }));

    await userEvent.selectOptions(screen.getByLabelText('Artículo'), '7');
    await waitFor(() => expect(lastParams()).toMatchObject({ etapaId: 2, articuloId: 7 }));

    await userEvent.type(screen.getByLabelText('Desde'), '2026-10-01');
    await waitFor(() => expect(lastParams()).toMatchObject({ desde: '2026-10-01' }));
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
