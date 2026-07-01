import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Muestra } from '../shared/types/domain';
import api from './axios';
import { updateMuestra } from './muestras';

vi.mock('./axios');

describe('updateMuestra', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends a PUT request with the observation body and returns the updated Muestra', async () => {
    const updated: Muestra = {
      id: 5,
      pesoNeto: 12.5,
      estadoValidacion: 'ok',
      usuarioId: 3,
      etapaId: 10,
      lineaProduccionId: 1,
      timestamp: '2026-07-01T10:00:00Z',
      observacion: 'nota editada',
    };
    vi.mocked(api.put).mockResolvedValueOnce({ data: { success: true, data: updated } });

    const result = await updateMuestra(5, { observacion: 'nota editada' });

    expect(api.put).toHaveBeenCalledWith('/muestras/5', { observacion: 'nota editada' });
    expect(result).toEqual(updated);
  });

  it('passes null observacion through when clearing the field', async () => {
    const updated: Muestra = {
      id: 9,
      pesoNeto: 1.0,
      estadoValidacion: 'ok',
      usuarioId: 3,
      etapaId: 10,
      lineaProduccionId: 1,
      timestamp: '2026-07-01T10:00:00Z',
      observacion: '',
    };
    vi.mocked(api.put).mockResolvedValueOnce({ data: { success: true, data: updated } });

    const result = await updateMuestra(9, { observacion: null });

    expect(api.put).toHaveBeenCalledWith('/muestras/9', { observacion: null });
    expect(result.id).toBe(9);
  });
});
