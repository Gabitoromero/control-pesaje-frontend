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

describe('Planta mode switch in the shared tablet layouts', () => {
  it('is rendered once by MuestrasLibresLayout (pasadas, muestras libres, historial)', () => {
    renderWithAuth(<MuestrasLibresLayout />, { user: operario, activeLineaId: 1 });

    expect(screen.getAllByRole('group', { name: 'Vista de Planta' })).toHaveLength(1);
  });

  it('is rendered once by TabletLayout (workspace)', () => {
    renderWithAuth(<TabletLayout />, { user: operario, activeLineaId: 1 });

    expect(screen.getAllByRole('group', { name: 'Vista de Planta' })).toHaveLength(1);
  });
});
