import { describe, it, expect, vi } from 'vitest';
import api from './axios';
import { assignDeviceToLinea } from './lineas';

vi.mock('./axios');

describe('assignDeviceToLinea', () => {
  it('calls PUT /lineas-produccion/:id/device with hardwareId and returns unwrapped data', async () => {
    const mockEnvelope = {
      data: {
        success: true,
        data: { id: 1, nombre: 'Línea 1', numeroBalanza: 1, hardwareId: 'rpi-abc123' },
      },
    };

    vi.mocked(api.put).mockResolvedValueOnce(mockEnvelope);

    const result = await assignDeviceToLinea(1, 'rpi-abc123');

    expect(api.put).toHaveBeenCalledWith('/lineas-produccion/1/device', { hardwareId: 'rpi-abc123' });
    expect(result).toEqual({ id: 1, nombre: 'Línea 1', numeroBalanza: 1, hardwareId: 'rpi-abc123' });
  });

  it('calls PUT with a different id and hardwareId to prove real serialization', async () => {
    const mockEnvelope = {
      data: {
        success: true,
        data: { id: 7, nombre: 'Línea 7', numeroBalanza: 2, hardwareId: 'rpi-xyz999' },
      },
    };

    vi.mocked(api.put).mockResolvedValueOnce(mockEnvelope);

    const result = await assignDeviceToLinea(7, 'rpi-xyz999');

    expect(api.put).toHaveBeenCalledWith('/lineas-produccion/7/device', { hardwareId: 'rpi-xyz999' });
    expect(result.hardwareId).toBe('rpi-xyz999');
  });
});
