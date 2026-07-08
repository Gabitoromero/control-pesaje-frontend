import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DispositivosConectadosPage } from './DispositivosConectadosPage';
import { dispositivosApi } from '../../../api/dispositivos';

vi.mock('../../../api/dispositivos', () => ({
  dispositivosApi: {
    getConectados: vi.fn(),
  },
}));

describe('DispositivosConectadosPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(dispositivosApi.getConectados).mockReturnValue(new Promise(() => {}));
    render(<DispositivosConectadosPage />);
    expect(screen.getByText(/cargando dispositivos/i)).toBeInTheDocument();
  });

  it('renders the list of devices', async () => {
    const mockDevices = [
      { socketId: 'sock-123', lineaId: 1, timestamp: new Date().toISOString() }
    ];
    vi.mocked(dispositivosApi.getConectados).mockResolvedValue(mockDevices);

    render(<DispositivosConectadosPage />);

    await waitFor(() => {
      expect(screen.getByText('sock-123')).toBeInTheDocument();
    });
    
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('wraps the table in a horizontal-scroll container so narrow viewports scroll instead of breaking the layout', async () => {
    const mockDevices = [
      { socketId: 'sock-123', lineaId: 1, timestamp: new Date().toISOString() }
    ];
    vi.mocked(dispositivosApi.getConectados).mockResolvedValue(mockDevices);

    render(<DispositivosConectadosPage />);

    await waitFor(() => {
      expect(screen.getByText('sock-123')).toBeInTheDocument();
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
});
