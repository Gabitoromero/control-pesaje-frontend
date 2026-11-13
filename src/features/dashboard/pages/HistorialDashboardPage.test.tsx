import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithAuth } from '../../../test/render';
import { HistorialDashboardPage } from './HistorialDashboardPage';
import { getHistorial, type HistorialResponse } from '../../../api/historial';

vi.mock('../../../api/historial', () => ({ getHistorial: vi.fn() }));
vi.mock('../../../api/etapas', () => ({
  getEtapas: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
  getEtapa: vi.fn(),
}));
vi.mock('../../../api/articulos', () => ({
  getArticulos: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
  getArticulo: vi.fn(),
}));

const jefe = { id: 2, legajo: 'J1', nombreUsuario: 'jefe1', rol: 'jefe' as const, puedeTomarMuestrasLibres: true };

const response: HistorialResponse = {
  items: [
    {
      id: 1,
      timestamp: '2026-10-01T12:00:00Z',
      pesoNeto: 12.5,
      pesoIdeal: 12,
      pesoMinimo: 10,
      pesoMaximo: 14,
      estadoValidacion: 'ok',
      observacion: null,
      pasadaId: 1,
      etapa: { id: 1, nombre: 'Mezcla' },
      rutaPasada: { id: 1, nombre: 'Ruta A' },
      articulo: { id: 7, codigo: 'ALF-01', nombre: 'Alfajor Triple' },
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
  kpis: { total: 1, ok: 1, fueraRango: 0, porcentajeOk: 100, porcentajeFueraRango: 0 },
};

describe('HistorialDashboardPage', () => {
  beforeEach(() => {
    vi.mocked(getHistorial).mockReset();
    vi.mocked(getHistorial).mockResolvedValue(response);
  });

  it('shows the history without an active line session and without the tablet header', async () => {
    renderWithAuth(<HistorialDashboardPage />, { user: jefe, activeLineaId: null });

    await waitFor(() => expect(screen.getByTestId('kpi-ok-pct')).toHaveTextContent('100%'));
    expect(screen.getByRole('list', { name: 'Listado de muestras' })).toBeInTheDocument();
    expect(screen.queryByTestId('tablet-page-root')).not.toBeInTheDocument();
  });

  it('sets the theme text color itself, since the dashboard layout does not provide one', async () => {
    renderWithAuth(<HistorialDashboardPage />, { user: jefe, activeLineaId: null });

    const list = await screen.findByRole('list', { name: 'Listado de muestras' });
    expect(list.closest('.text-foreground')).not.toBeNull();
  });
});
