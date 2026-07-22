import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../../../test/render';
import { MonitoreoFullscreenPage } from './MonitoreoFullscreenPage';
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

describe('MonitoreoFullscreenPage', () => {
  it('passes lineaNombre and rutaActivaNombre to the header (previously missing)', () => {
    vi.mocked(useMonitoreoLineas).mockReturnValue({
      ...baseHookResult,
      lineas: [{ id: 1, nombre: 'Linea Fullscreen', activo: true, rutaAsignadaAt: null, rutaPasadaActiva: { id: 10, nombre: 'Ruta Fullscreen' }, dispositivo: { id: '5' } }],
      lineaActual: { id: 1, nombre: 'Linea Fullscreen', activo: true, rutaAsignadaAt: null, rutaPasadaActiva: { id: 10, nombre: 'Ruta Fullscreen' }, dispositivo: { id: '5' } },
      resumen: { conectado: false, pasadaEnCurso: null, tiempoDesdeRuta: null },
      kpis: { muestrasTotales: 0, fueraRango: 0, pasadasFinalizadas: 0, pasadasEnCurso: 0 },
    });

    renderWithProviders(<MonitoreoFullscreenPage />);

    expect(screen.getByText('Linea Fullscreen')).toBeInTheDocument();
    expect(screen.getByText('Ruta Fullscreen')).toBeInTheDocument();
  });

  it('renders the EmptyState when isEmpty is true', () => {
    vi.mocked(useMonitoreoLineas).mockReturnValue({ ...baseHookResult, isEmpty: true });

    renderWithProviders(<MonitoreoFullscreenPage />);

    expect(screen.getByText('Sin líneas activas')).toBeInTheDocument();
  });
});
