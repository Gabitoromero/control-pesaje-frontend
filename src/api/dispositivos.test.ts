import { describe, it, expect, vi } from 'vitest';
import api from './axios';
import { dispositivosApi } from './dispositivos';

vi.mock('./axios');

describe('dispositivosApi', () => {
  it('should fetch getConectados', async () => {
    const mockData = [{ socketId: 'test', lineaId: 1, timestamp: new Date().toISOString() }];
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

    const result = await dispositivosApi.getConectados();
    expect(result).toEqual(mockData);
    expect(api.get).toHaveBeenCalledWith('/dispositivos/conectados');
  });
});
