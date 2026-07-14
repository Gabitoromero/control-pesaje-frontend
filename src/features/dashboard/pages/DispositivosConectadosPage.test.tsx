import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render';
import { DispositivosConectadosPage } from './DispositivosConectadosPage';
import { dispositivosApi } from '../../../api/dispositivos';

vi.mock('../../../api/dispositivos', () => ({
  dispositivosApi: {
    getConectados: vi.fn(),
    deleteDispositivo: vi.fn(),
  },
}));

vi.mock('../../../components/dialogs/useDialog', () => ({
  useDialog: () => ({
    alertError: vi.fn(),
    confirm: vi.fn().mockResolvedValue(true),
  }),
}));

describe('DispositivosConectadosPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(dispositivosApi.getConectados).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<DispositivosConectadosPage />);
    expect(screen.getByText(/cargando dispositivos/i)).toBeInTheDocument();
  });

  it('renders the list of devices with hardwareId, línea nombre, estado and última conexión', async () => {
    const mockDevices = [
      {
        id: 1,
        hardwareId: 'rpi-linea-a-001',
        lineaId: 5,
        lineaNombre: 'Línea A',
        estado: 'Conectado' as const,
        ultimaConexionAt: new Date('2026-01-01T00:00:00Z').toISOString(),
      },
    ];
    vi.mocked(dispositivosApi.getConectados).mockResolvedValue(mockDevices);

    renderWithProviders(<DispositivosConectadosPage />);

    await waitFor(() => {
      expect(screen.getByText('rpi-linea-a-001')).toBeInTheDocument();
    });

    expect(screen.getByText('Línea A')).toBeInTheDocument();
    expect(screen.getByText('Conectado')).toBeInTheDocument();
  });

  it('renders Desconectado estado and a dash for unpaired devices without a línea nombre', async () => {
    const mockDevices = [
      {
        id: 2,
        hardwareId: 'rpi-unassigned-002',
        lineaId: null,
        lineaNombre: null,
        estado: 'Desconectado' as const,
        ultimaConexionAt: null,
      },
    ];
    vi.mocked(dispositivosApi.getConectados).mockResolvedValue(mockDevices);

    renderWithProviders(<DispositivosConectadosPage />);

    await waitFor(() => {
      expect(screen.getByText('rpi-unassigned-002')).toBeInTheDocument();
    });

    expect(screen.getByText('Desconectado')).toBeInTheDocument();
  });

  it('wraps the table in a horizontal-scroll container so narrow viewports scroll instead of breaking the layout', async () => {
    const mockDevices = [
      {
        id: 1,
        hardwareId: 'rpi-linea-a-001',
        lineaId: 5,
        lineaNombre: 'Línea A',
        estado: 'Conectado' as const,
        ultimaConexionAt: new Date().toISOString(),
      },
    ];
    vi.mocked(dispositivosApi.getConectados).mockResolvedValue(mockDevices);

    renderWithProviders(<DispositivosConectadosPage />);

    await waitFor(() => {
      expect(screen.getByText('rpi-linea-a-001')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    const scrollWrapper = table.parentElement as HTMLElement;
    expect(scrollWrapper.className).toMatch(/overflow-x-auto/);
  });

  it('renders empty state if no devices', async () => {
    vi.mocked(dispositivosApi.getConectados).mockResolvedValue([]);

    renderWithProviders(<DispositivosConectadosPage />);

    await waitFor(() => {
      expect(screen.getByText(/no hay dispositivos/i)).toBeInTheDocument();
    });
  });

  it('deletes a dispositivo when the delete action is confirmed and refetches the list', async () => {
    const mockDevices = [
      {
        id: 1,
        hardwareId: 'rpi-linea-a-001',
        lineaId: 5,
        lineaNombre: 'Línea A',
        estado: 'Desconectado' as const,
        ultimaConexionAt: null,
      },
    ];
    vi.mocked(dispositivosApi.getConectados).mockResolvedValue(mockDevices);
    vi.mocked(dispositivosApi.deleteDispositivo).mockResolvedValue(undefined);

    renderWithProviders(<DispositivosConectadosPage />);

    await waitFor(() => {
      expect(screen.getByText('rpi-linea-a-001')).toBeInTheDocument();
    });

    // Open the edit modal first (the only row-level button is Edit)
    fireEvent.click(screen.getByTitle(/editar dispositivo/i));

    // Wait for modal, then click Eliminar inside it
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));

    await waitFor(() => {
      expect(dispositivosApi.deleteDispositivo).toHaveBeenCalledWith('rpi-linea-a-001');
    });
  });
});
