import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './axios';
import { getHistorial, type HistorialResponse } from './historial';

vi.mock('./axios');

const emptyResponse: HistorialResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  kpis: { total: 0, ok: 0, fueraRango: 0, porcentajeOk: 0, porcentajeFueraRango: 0 },
};

describe('getHistorial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GETs /muestras/historial with the filters as query params and unwraps the envelope', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: emptyResponse } });
    const params = { etapaId: 2, articuloId: 3, q: 'alf', desde: '2026-10-01', hasta: '2026-10-05', page: 2, pageSize: 10 };

    const result = await getHistorial(params);

    expect(api.get).toHaveBeenCalledWith('/muestras/historial', { params });
    expect(result).toEqual(emptyResponse);
  });

  it('never sends a user id (scope comes from the token)', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: emptyResponse } });

    await getHistorial();

    const [, config] = vi.mocked(api.get).mock.calls[0];
    expect(config).toEqual({ params: {} });
  });
});
