import { describe, it, expect, vi } from 'vitest';
import api from './axios';
import { getPasadas, getPasada, iniciarPasada, completarPasada, abortarPasada } from './pasadas';

vi.mock('./axios');

describe('iniciarPasada', () => {
  it('sends { lineaProduccionId, idBalanza } and no articuloId', async () => {
    const mockEnvelope = {
      data: {
        success: true,
        data: { id: 1, lineaProduccionId: 2, estado: 'en_curso', idBalanza: 3 },
      },
    };
    vi.mocked(api.post).mockResolvedValueOnce(mockEnvelope);

    const result = await iniciarPasada({ lineaProduccionId: 2, idBalanza: 3 });

    expect(api.post).toHaveBeenCalledWith('/pasadas', { lineaProduccionId: 2, idBalanza: 3 });
    const sentPayload = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>;
    expect(sentPayload).not.toHaveProperty('articuloId');
    expect(result).toEqual({ id: 1, lineaProduccionId: 2, estado: 'en_curso', idBalanza: 3 });
  });

  it('sends a different idBalanza to prove real serialization', async () => {
    const mockEnvelope = {
      data: {
        success: true,
        data: { id: 9, lineaProduccionId: 7, estado: 'en_curso', idBalanza: 11 },
      },
    };
    vi.mocked(api.post).mockResolvedValueOnce(mockEnvelope);

    await iniciarPasada({ lineaProduccionId: 7, idBalanza: 11 });

    expect(api.post).toHaveBeenCalledWith('/pasadas', { lineaProduccionId: 7, idBalanza: 11 });
  });
});

describe('getPasadas', () => {
  it('sends lineaProduccionId as a query param and unwraps the envelope', async () => {
    const mockData = [{ id: 1, estado: 'en_curso' }];
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: mockData } });

    const result = await getPasadas({ lineaProduccionId: 4 });

    expect(api.get).toHaveBeenCalledWith('/pasadas', { params: { lineaProduccionId: 4 } });
    expect(result).toEqual(mockData);
  });
});

describe('getPasada', () => {
  it('calls GET /pasadas/:id and unwraps the envelope', async () => {
    const mockData = { id: 5, estado: 'completa' };
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: mockData } });

    const result = await getPasada(5);

    expect(api.get).toHaveBeenCalledWith('/pasadas/5');
    expect(result).toEqual(mockData);
  });
});

describe('completarPasada', () => {
  it('calls PUT /pasadas/:id with action completar', async () => {
    const mockData = { id: 5, estado: 'completa' };
    vi.mocked(api.put).mockResolvedValueOnce({ data: { success: true, data: mockData } });

    const result = await completarPasada(5);

    expect(api.put).toHaveBeenCalledWith('/pasadas/5', { action: 'completar' });
    expect(result).toEqual(mockData);
  });
});

describe('abortarPasada', () => {
  it('calls PUT /pasadas/:id with action abortar and motivoCierre', async () => {
    const mockData = { id: 5, estado: 'abortada' };
    vi.mocked(api.put).mockResolvedValueOnce({ data: { success: true, data: mockData } });

    const result = await abortarPasada(5, 'error de calibración');

    expect(api.put).toHaveBeenCalledWith('/pasadas/5', { action: 'abortar', motivoCierre: 'error de calibración' });
    expect(result).toEqual(mockData);
  });
});
