import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers, lineasMock } from '../../../test/handlers';
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
    expect(screen.getAllByRole('button', { name: /asignar/i })).toHaveLength(2);
  });

  it('clicking "Asignar" opens the dialog populated with líneas options', async () => {
    vi.mocked(useAdminSocket).mockReturnValue({
      unassignedDevices: ['rpi-aaaaaaaaaaaa'],
      resolveDevice,
    });

    renderWithProviders(<UnassignedDeviceBanner />);

    await userEvent.click(screen.getByRole('button', { name: /asignar/i }));

    const dialog = await screen.findByRole('dialog');
    await waitFor(() => {
      expect(within(dialog).getByRole('option', { name: lineasMock[0].nombre })).toBeInTheDocument();
    });
    expect(within(dialog).getByRole('option', { name: lineasMock[1].nombre })).toBeInTheDocument();
    expect(within(dialog).getByRole('option', { name: lineasMock[2].nombre })).toBeInTheDocument();
  });

  it('confirming with a selected línea calls assignDeviceToLinea and removes the card on success', async () => {
    let requestBody: unknown = null;
    let requestedId: string | undefined;
    server.use(
      http.put(`${BASE}/lineas-produccion/:id/device`, async ({ request, params }) => {
        requestedId = params.id as string;
        requestBody = await request.json();
        return HttpResponse.json({ success: true, data: { ...lineasMock[0], hardwareId: 'rpi-aaaaaaaaaaaa' } });
      })
    );

    vi.mocked(useAdminSocket).mockReturnValue({
      unassignedDevices: ['rpi-aaaaaaaaaaaa'],
      resolveDevice,
    });

    renderWithProviders(<UnassignedDeviceBanner />);

    await userEvent.click(screen.getByRole('button', { name: /asignar/i }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => {
      expect(within(dialog).getByRole('option', { name: lineasMock[0].nombre })).toBeInTheDocument();
    });

    await userEvent.selectOptions(within(dialog).getByRole('combobox'), String(lineasMock[0].id));
    await userEvent.click(within(dialog).getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(requestBody).toEqual({ hardwareId: 'rpi-aaaaaaaaaaaa' });
    });
    expect(requestedId).toBe(String(lineasMock[0].id));

    await waitFor(() => {
      expect(resolveDevice).toHaveBeenCalledWith('rpi-aaaaaaaaaaaa');
    });
  });

  it('shows an error and keeps the card visible when assignment fails', async () => {
    server.use(
      http.put(`${BASE}/lineas-produccion/:id/device`, () =>
        HttpResponse.json(
          { success: false, error: { message: 'Dispositivo ya asignado a otra línea' } },
          { status: 400 }
        )
      )
    );

    vi.mocked(useAdminSocket).mockReturnValue({
      unassignedDevices: ['rpi-aaaaaaaaaaaa'],
      resolveDevice,
    });

    renderWithProviders(<UnassignedDeviceBanner />);

    await userEvent.click(screen.getByRole('button', { name: /asignar/i }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => {
      expect(within(dialog).getByRole('option', { name: lineasMock[0].nombre })).toBeInTheDocument();
    });

    await userEvent.selectOptions(within(dialog).getByRole('combobox'), String(lineasMock[0].id));
    await userEvent.click(within(dialog).getByRole('button', { name: /confirmar/i }));

    const errorDialog = await screen.findByRole('alertdialog');
    expect(within(errorDialog).getByText('Dispositivo ya asignado a otra línea')).toBeInTheDocument();

    expect(resolveDevice).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /^asignar$/i, hidden: true })).toBeInTheDocument();
  });
});
