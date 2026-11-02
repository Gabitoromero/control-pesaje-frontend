import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithAuth } from '../../../test/render';
import { MuestrasLibresLayout } from './MuestrasLibresLayout';
import { TabletLayout } from '../../../layouts/TabletLayout';

vi.mock('../hooks/useActividadHeartbeat', () => ({
  useActividadHeartbeat: vi.fn(),
  resolveHeartbeatInterval: (_envValue: string | undefined, defaultMs = 120000) => defaultMs,
}));
vi.mock('../../../api/lineas', () => ({
  getLinea: vi.fn().mockResolvedValue({ id: 1, nombre: 'Línea 1', rutaPasadaActiva: null, activo: true }),
}));

const operario = {
  id: 3,
  legajo: 'O1',
  nombreUsuario: 'operario1',
  rol: 'operario' as const,
  puedeTomarMuestrasLibres: false,
};

// The switch lives in the header of Gestión de Pasadas and Mi historial only (see TabletPlantaHeader),
// so the layouts that wrap muestras libres and the workspace must not show it.
describe('Planta mode switch is not part of the shared tablet layouts', () => {
  it('MuestrasLibresLayout does not render it', () => {
    renderWithAuth(<MuestrasLibresLayout />, { user: operario, activeLineaId: 1 });

    expect(screen.queryByRole('group', { name: 'Vista de Planta' })).not.toBeInTheDocument();
  });

  it('TabletLayout (workspace) does not render it', () => {
    renderWithAuth(<TabletLayout />, { user: operario, activeLineaId: 1 });

    expect(screen.queryByRole('group', { name: 'Vista de Planta' })).not.toBeInTheDocument();
  });
});
