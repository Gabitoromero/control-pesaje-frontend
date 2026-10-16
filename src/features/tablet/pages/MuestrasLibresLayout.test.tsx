import { screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithAuth } from '../../../test/render';
import { MuestrasLibresLayout } from './MuestrasLibresLayout';

const heartbeatMock = vi.fn();
let lastOnSessionLost: (() => void) | undefined;
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});
vi.mock('../hooks/useActividadHeartbeat', () => ({
  useActividadHeartbeat: (lineaId: number | null, onSessionLost?: () => void) => {
    heartbeatMock(lineaId);
    lastOnSessionLost = onSessionLost;
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
    navigateMock.mockClear();
    lastOnSessionLost = undefined;
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

  it('si el latido informa sesión perdida avisa al operario, limpia la línea y va a la selección de línea', async () => {
    const { authValue } = renderWithAuth(<MuestrasLibresLayout />, {
      user: operarioUser,
      activeLineaId: 1,
    });

    expect(lastOnSessionLost).toBeTypeOf('function');
    act(() => {
      lastOnSessionLost!();
    });

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Sesión cerrada')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button'));

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith('/tablet/seleccion-linea', { replace: true }),
    );
    expect(authValue.closeLineSession).toHaveBeenCalledTimes(1);
  });
});
