import { describe, it, expect, vi } from 'vitest';
import api from './axios';
import { assignDeviceToLinea } from './lineas';

vi.mock('./axios');

describe('assignDeviceToLinea', () => {
  it('calls PUT /lineas-produccion/:id/device with hardwareId and returns unwrapped data with nested dispositivo', async () => {
    const mockEnvelope = {
      data: {
        success: true,
        data: {
          id: 1,
          nombre: 'Línea 1',
          numeroBalanza: 1,
          dispositivo: { hardwareId: 'rpi-abc123', ultimaConexionAt: null },
        },
      },
    };

    vi.mocked(api.put).mockResolvedValueOnce(mockEnvelope);

    const result = await assignDeviceToLinea(1, 'rpi-abc123');

    expect(api.put).toHaveBeenCalledWith('/lineas-produccion/1/device', { hardwareId: 'rpi-abc123' });
    expect(result).toEqual({
      id: 1,
      nombre: 'Línea 1',
      numeroBalanza: 1,
      dispositivo: { hardwareId: 'rpi-abc123', ultimaConexionAt: null },
    });
    expect(result).not.toHaveProperty('hardwareId');
  });

  it('calls PUT with a different id and hardwareId to prove real serialization', async () => {
    const mockEnvelope = {
      data: {
        success: true,
        data: {
          id: 7,
          nombre: 'Línea 7',
          numeroBalanza: 2,
          dispositivo: { hardwareId: 'rpi-xyz999', ultimaConexionAt: null },
        },
      },
    };

    vi.mocked(api.put).mockResolvedValueOnce(mockEnvelope);

    const result = await assignDeviceToLinea(7, 'rpi-xyz999');

    expect(api.put).toHaveBeenCalledWith('/lineas-produccion/7/device', { hardwareId: 'rpi-xyz999' });
    expect(result.dispositivo.hardwareId).toBe('rpi-xyz999');
  });
});
