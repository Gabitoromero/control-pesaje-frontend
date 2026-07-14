import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../../../test/render';
import { MonitoreoPage } from './MonitoreoPage';
import { useMonitoreoLineas } from '../hooks/useMonitoreoLineas';

vi.mock('../hooks/useMonitoreoLineas', () => ({
  useMonitoreoLineas: vi.fn(),
}));

const baseHookResult = {
  lineas: [],
  lineaActual: null,
  resumen: undefined,
  kpis: undefined,
  etapas: [],
  isEmpty: false,
  isLoading: false,
  lineaIndex: 0,
  onLineaChange: vi.fn(),
};

describe('MonitoreoPage', () => {
  it('renders the EmptyState when isEmpty is true', () => {
    vi.mocked(useMonitoreoLineas).mockReturnValue({ ...baseHookResult, isEmpty: true });

    renderWithProviders(<MonitoreoPage />);

    expect(screen.getByText('Sin líneas activas')).toBeInTheDocument();
  });

  it('shows the "Sin dispositivo" badge when the línea activa has no dispositivo', () => {
    vi.mocked(useMonitoreoLineas).mockReturnValue({
      ...baseHookResult,
      lineas: [{ id: 1, nombre: 'Linea 1', activo: true, rutaPasadaActiva: { id: 10, nombre: 'Ruta A' }, dispositivo: null }],
      lineaActual: { id: 1, nombre: 'Linea 1', activo: true, rutaPasadaActiva: { id: 10, nombre: 'Ruta A' }, dispositivo: null },
      resumen: { conectado: false, pasadaEnCurso: null },
      kpis: { muestrasTotales: 0, fueraRango: 0, pasadasFinalizadas: 0, pasadasEnCurso: 0 },
    });

    renderWithProviders(<MonitoreoPage />);

    expect(screen.getByText(/sin dispositivo/i)).toBeInTheDocument();
  });

  it('does not show the badge when the línea activa has a dispositivo', () => {
    vi.mocked(useMonitoreoLineas).mockReturnValue({
      ...baseHookResult,
      lineas: [{ id: 1, nombre: 'Linea 1', activo: true, rutaPasadaActiva: { id: 10, nombre: 'Ruta A' }, dispositivo: { id: 5 } }],
      lineaActual: { id: 1, nombre: 'Linea 1', activo: true, rutaPasadaActiva: { id: 10, nombre: 'Ruta A' }, dispositivo: { id: 5 } },
      resumen: { conectado: false, pasadaEnCurso: null },
      kpis: { muestrasTotales: 0, fueraRango: 0, pasadasFinalizadas: 0, pasadasEnCurso: 0 },
    });

    renderWithProviders(<MonitoreoPage />);

    expect(screen.queryByText(/sin dispositivo/i)).not.toBeInTheDocument();
  });
});
