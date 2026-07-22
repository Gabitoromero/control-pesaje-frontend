import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithAuth } from '../../../test/render';
import { MuestrasLibresLayout } from './MuestrasLibresLayout';

const heartbeatMock = vi.fn();
vi.mock('../hooks/useActividadHeartbeat', () => ({
  useActividadHeartbeat: (lineaId: number | null) => {
    heartbeatMock(lineaId);
  },
  resolveHeartbeatInterval: (_envValue: string | undefined, defaultMs = 120000) =>
    defaultMs,
}));

vi.mock('../../../api/lineas', () => ({
  getLinea: vi.fn().mockResolvedValue({
    id: 1,
    nombre: 'Línea 1',
    rutaPasadaActiva: { id: 10, nombre: 'Ruta A', etapas: [] },
    dispositivo: { id: 1, hardwareId: 'rpi-001' },
    activo: true,
  }),
}));

const operarioUser = {
  id: 3,
  legajo: 'O1',
  nombreUsuario: 'operario1',
  rol: 'operario' as const,
  puedeTomarMuestrasLibres: false,
};

describe('MuestrasLibresLayout — heartbeat', () => {
  beforeEach(() => {
    heartbeatMock.mockClear();
  });

  it('inicia el heartbeat de actividad con el activeLineaId cuando hay sesión activa', () => {
    renderWithAuth(<MuestrasLibresLayout />, {
      user: operarioUser,
      activeLineaId: 1,
    });

    expect(heartbeatMock).toHaveBeenCalledWith(1);
  });

  it('no inicia el heartbeat cuando no hay sesión de línea activa (redirige)', () => {
    renderWithAuth(<MuestrasLibresLayout />, {
      user: operarioUser,
      activeLineaId: null,
    });

    // The layout redirects before rendering children; heartbeat must not run
    expect(heartbeatMock).not.toHaveBeenCalledWith(1);
  });
});
