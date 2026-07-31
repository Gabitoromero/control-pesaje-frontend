import { describe, it, expect, vi } from 'vitest';
import api from './axios';
import { assignDeviceToLinea, createLinea, updateLinea } from './lineas';

vi.mock('./axios');

describe('createLinea', () => {
  it('sends idBalanza and articuloId in the POST payload', async () => {
    const mockEnvelope = {
      data: {
        success: true,
        data: { id: 1, nombre: 'Línea 1', idBalanza: 2, articuloId: 3 },
      },
    };
    vi.mocked(api.post).mockResolvedValueOnce(mockEnvelope);

    const result = await createLinea({ nombre: 'Línea 1', idBalanza: 2, articuloId: 3 });

    expect(api.post).toHaveBeenCalledWith('/lineas-produccion', {
      nombre: 'Línea 1',
      idBalanza: 2,
      articuloId: 3,
    });
    expect(result).toEqual({ id: 1, nombre: 'Línea 1', idBalanza: 2, articuloId: 3 });
  });

  it('sends a different idBalanza/articuloId pair to prove real serialization', async () => {
    const mockEnvelope = {
      data: {
        success: true,
        data: { id: 5, nombre: 'Línea 5', idBalanza: 8, articuloId: 9 },
      },
    };
    vi.mocked(api.post).mockResolvedValueOnce(mockEnvelope);

    await createLinea({ nombre: 'Línea 5', idBalanza: 8, articuloId: 9 });

    expect(api.post).toHaveBeenCalledWith('/lineas-produccion', {
      nombre: 'Línea 5',
      idBalanza: 8,
      articuloId: 9,
    });
  });
});

describe('updateLinea', () => {
  it('sends idBalanza and articuloId in the PUT payload', async () => {
    const mockEnvelope = {
      data: {
        success: true,
        data: { id: 1, nombre: 'Línea 1 editada', idBalanza: 4, articuloId: 6 },
      },
    };
    vi.mocked(api.put).mockResolvedValueOnce(mockEnvelope);

    const result = await updateLinea(1, { nombre: 'Línea 1 editada', idBalanza: 4, articuloId: 6 });

    expect(api.put).toHaveBeenCalledWith('/lineas-produccion/1', {
      nombre: 'Línea 1 editada',
      idBalanza: 4,
      articuloId: 6,
    });
    expect(result.idBalanza).toBe(4);
    expect(result.articuloId).toBe(6);
  });
});

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
    expect(result.dispositivo?.hardwareId).toBe('rpi-xyz999');
  });
});
