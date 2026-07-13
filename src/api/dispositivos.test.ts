import { describe, it, expect, vi } from 'vitest';
import api from './axios';
import { dispositivosApi } from './dispositivos';

vi.mock('./axios');

describe('dispositivosApi', () => {
  it('should fetch getConectados', async () => {
    const mockData = [
      {
        id: 1,
        hardwareId: 'rpi-linea-a-001',
        lineaId: 5,
        lineaNombre: 'Línea A',
        estado: 'Desconectado',
        ultimaConexionAt: new Date().toISOString(),
      },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

    const result = await dispositivosApi.getConectados();
    expect(result).toEqual(mockData);
    expect(api.get).toHaveBeenCalledWith('/dispositivos/conectados');
  });

  it('should call delete for deleteDispositivo', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { success: true, data: { id: 3 } } });

    await dispositivosApi.deleteDispositivo(3);

    expect(api.delete).toHaveBeenCalledWith('/dispositivos/3');
  });
});
