import { describe, it, expect, vi } from 'vitest';
import api from './axios';
import { getArticulosPorRuta } from './rutas-pasadas-articulos';

vi.mock('./axios');

describe('getArticulosPorRuta', () => {
  it('calls GET /rutas-pasadas-articulos with rutaPasadaId and returns mapped articles', async () => {
    const mockEnvelope = {
      data: {
        success: true,
        data: [
          {
            id: 1,
            articulo: { id: 10, nombre: 'Art A', marca: 'M' },
            rutaPasada: { id: 99 }
          }
        ]
      }
    };

    vi.mocked(api.get).mockResolvedValueOnce(mockEnvelope);

    const result = await getArticulosPorRuta(99);

    expect(api.get).toHaveBeenCalledWith('/rutas-pasadas-articulos', {
      params: { rutaPasadaId: 99 }
    });
    expect(result).toEqual([{ id: 10, nombre: 'Art A', marca: 'M' }]);
  });
});
