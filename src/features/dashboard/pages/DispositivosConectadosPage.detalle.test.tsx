import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render';
import { DispositivosConectadosPage } from './DispositivosConectadosPage';
import { dispositivosApi } from '../../../api/dispositivos';

vi.mock('../../../api/dispositivos', () => ({
  dispositivosApi: { getConectados: vi.fn(), deleteDispositivo: vi.fn(), updateDispositivo: vi.fn() },
}));

const HARDWARE_ID = 'rpi-linea-a-001-con-un-identificador-bastante-largo';

describe('DispositivosConectadosPage detail drawer', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(dispositivosApi.getConectados).mockResolvedValue([
      {
        hardwareId: HARDWARE_ID,
        nombre: 'RPI Linea A',
        lineaId: 5,
        lineaNombre: 'Línea A',
        estado: 'Encendido',
        ultimaConexionAt: '2026-01-01T00:00:00.000Z',
        unidad: 'kg',
      },
      { hardwareId: 'rpi-2', nombre: 'RPI sin par', lineaId: null, lineaNombre: null, estado: 'Desconectado', ultimaConexionAt: null, unidad: null },
    ]);
  });

  it('shows every field in full without opening the edit form and without a history action', async () => {
    renderWithProviders(<DispositivosConectadosPage />);
    await waitFor(() => expect(screen.getByText('RPI Linea A')).toBeInTheDocument());

    const row = screen.getByText('RPI Linea A').closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: 'Ver detalle' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Detalle del dispositivo')).toBeInTheDocument();
    expect(within(dialog).getAllByText('RPI Linea A')).toHaveLength(1);
    expect(within(dialog).getByText(HARDWARE_ID)).toBeInTheDocument();
    expect(within(dialog).getByText('Línea A')).toBeInTheDocument();
    expect(within(dialog).getByText('Encendido')).toBeInTheDocument();
    expect(within(dialog).getByText(new Date('2026-01-01T00:00:00.000Z').toLocaleString())).toBeInTheDocument();
    expect(within(dialog).getByText('kg')).toBeInTheDocument();
    expect(screen.queryByText('Editar Dispositivo', { selector: 'h2' })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /historial/i })).not.toBeInTheDocument();
  });

  it('shows a dash for the fields a device does not have', async () => {
    renderWithProviders(<DispositivosConectadosPage />);
    await waitFor(() => expect(screen.getByText('RPI sin par')).toBeInTheDocument());

    const row = screen.getByText('RPI sin par').closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: 'Ver detalle' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByText('-')).toHaveLength(3);
  });
});
