import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DispositivosConectadosPage } from './DispositivosConectadosPage';
import { dispositivosApi } from '../../../api/dispositivos';

vi.mock('../../../api/dispositivos', () => ({
  dispositivosApi: {
    getConectados: vi.fn(),
    deleteDispositivo: vi.fn(),
  },
}));

describe('DispositivosConectadosPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders loading state initially', () => {
    vi.mocked(dispositivosApi.getConectados).mockReturnValue(new Promise(() => {}));
    render(<DispositivosConectadosPage />);
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

    render(<DispositivosConectadosPage />);

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

    render(<DispositivosConectadosPage />);

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

    render(<DispositivosConectadosPage />);

    await waitFor(() => {
      expect(screen.getByText('rpi-linea-a-001')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    const scrollWrapper = table.parentElement as HTMLElement;
    expect(scrollWrapper.className).toMatch(/overflow-x-auto/);
  });

  it('renders empty state if no devices', async () => {
    vi.mocked(dispositivosApi.getConectados).mockResolvedValue([]);

    render(<DispositivosConectadosPage />);

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

    render(<DispositivosConectadosPage />);

    await waitFor(() => {
      expect(screen.getByText('rpi-linea-a-001')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));

    await waitFor(() => {
      expect(dispositivosApi.deleteDispositivo).toHaveBeenCalledWith(1);
    });

    expect(dispositivosApi.getConectados).toHaveBeenCalledTimes(2);
  });
});
