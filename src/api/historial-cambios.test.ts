import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './axios';
import { getHistorialCambios, type HistorialCambiosResponse } from './historial-cambios';

vi.mock('./axios');

const empty: HistorialCambiosResponse = { items: [], total: 0, page: 1, pageSize: 20 };

describe('getHistorialCambios', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GETs /historial-cambios with the root and filters, and unwraps the envelope', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: empty } });
    const params = { raizTipo: 'ruta' as const, raizId: 4, usuarioId: 2, desde: '2026-11-01', hasta: '2026-11-12', page: 2, pageSize: 10 };

    const result = await getHistorialCambios(params);

    expect(api.get).toHaveBeenCalledWith('/historial-cambios', { params });
    expect(result).toEqual(empty);
  });
});
