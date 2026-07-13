import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers } from '../../../test/handlers';
import { renderWithProviders } from '../../../test/render';
import { UnassignedDeviceBanner } from './UnassignedDeviceBanner';
import { useAdminSocket } from '../hooks/useAdminSocket';

const BASE = 'http://localhost:3000/api';

vi.mock('../hooks/useAdminSocket', () => ({
  useAdminSocket: vi.fn(),
}));

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

describe('UnassignedDeviceBanner', () => {
  const resolveDevice = vi.fn();

  beforeEach(() => {
    vi.mocked(useAdminSocket).mockReturnValue({
      unassignedDevices: [],
      resolveDevice,
    });
  });

  it('renders nothing when there are no unassigned devices', () => {
    renderWithProviders(<UnassignedDeviceBanner />);
    expect(screen.queryByText(/dispositivo desconocido/i)).not.toBeInTheDocument();
  });

  it('renders one card per unassigned device', () => {
    vi.mocked(useAdminSocket).mockReturnValue({
      unassignedDevices: ['rpi-aaaaaaaaaaaa', 'rpi-bbbbbbbbbbbb'],
      resolveDevice,
    });

    renderWithProviders(<UnassignedDeviceBanner />);

    expect(screen.getAllByText(/dispositivo desconocido/i)).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /registrar dispositivo/i })).toHaveLength(2);
  });

  it('does not render any línea picker, dialog, or assignment UI', () => {
    vi.mocked(useAdminSocket).mockReturnValue({
      unassignedDevices: ['rpi-aaaaaaaaaaaa'],
      resolveDevice,
    });

    renderWithProviders(<UnassignedDeviceBanner />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('clicking "Registrar dispositivo" calls createDispositivo with only hardwareId and resolves the card on success', async () => {
    let requestBody: unknown = null;
    server.use(
      http.post(`${BASE}/dispositivos`, async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json(
          {
            success: true,
            data: {
              hardwareId: 'rpi-aaaaaaaaaaaa',
              nombre: 'Pi-aaaa',
              lineaId: null,
              lineaNombre: null,
              estado: 'Desconectado',
              ultimaConexionAt: null,
            },
          },
          { status: 201 }
        );
      })
    );

    vi.mocked(useAdminSocket).mockReturnValue({
      unassignedDevices: ['rpi-aaaaaaaaaaaa'],
      resolveDevice,
    });

    renderWithProviders(<UnassignedDeviceBanner />);

    await userEvent.click(screen.getByRole('button', { name: /registrar dispositivo/i }));

    await waitFor(() => {
      expect(requestBody).toEqual({ hardwareId: 'rpi-aaaaaaaaaaaa' });
    });

    await waitFor(() => {
      expect(resolveDevice).toHaveBeenCalledWith('rpi-aaaaaaaaaaaa');
    });
  });

  it('treats "El dispositivo ya existe" (400) as success-equivalent: still resolves and invalidates', async () => {
    server.use(
      http.post(`${BASE}/dispositivos`, () =>
        HttpResponse.json(
          { success: false, error: { message: 'El dispositivo ya existe' } },
          { status: 400 }
        )
      )
    );

    vi.mocked(useAdminSocket).mockReturnValue({
      unassignedDevices: ['rpi-aaaaaaaaaaaa'],
      resolveDevice,
    });

    renderWithProviders(<UnassignedDeviceBanner />);

    await userEvent.click(screen.getByRole('button', { name: /registrar dispositivo/i }));

    await waitFor(() => {
      expect(resolveDevice).toHaveBeenCalledWith('rpi-aaaaaaaaaaaa');
    });
  });

  it('shows an error and keeps the card visible when registration fails for any other reason', async () => {
    server.use(
      http.post(`${BASE}/dispositivos`, () =>
        HttpResponse.json(
          { success: false, error: { message: 'Error interno del servidor' } },
          { status: 500 }
        )
      )
    );

    vi.mocked(useAdminSocket).mockReturnValue({
      unassignedDevices: ['rpi-aaaaaaaaaaaa'],
      resolveDevice,
    });

    renderWithProviders(<UnassignedDeviceBanner />);

    await userEvent.click(screen.getByRole('button', { name: /registrar dispositivo/i }));

    const errorDialog = await screen.findByRole('alertdialog');
    expect(within(errorDialog).getByText('Error interno del servidor')).toBeInTheDocument();

    expect(resolveDevice).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /registrar dispositivo/i, hidden: true })).toBeInTheDocument();
  });
});
