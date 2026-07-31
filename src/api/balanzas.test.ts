import { describe, it, expect, vi } from 'vitest';
import api from './axios';
import {
  getBalanzas,
  getBalanzasInactivas,
  getBalanza,
  createBalanza,
  updateBalanza,
  deleteBalanza,
} from './balanzas';

vi.mock('./axios');

describe('balanzas api', () => {
  it('getBalanzas calls GET /balanzas and unwraps the envelope', async () => {
    const mockData = [{ id: 1, nombre: 'Balanza 1', activo: true }];
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: mockData } });

    const result = await getBalanzas();

    expect(api.get).toHaveBeenCalledWith('/balanzas');
    expect(result).toEqual(mockData);
  });

  it('getBalanzasInactivas calls GET /balanzas/inactive and unwraps the envelope', async () => {
    const mockData = [{ id: 2, nombre: 'Balanza 2', activo: false }];
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: mockData } });

    const result = await getBalanzasInactivas();

    expect(api.get).toHaveBeenCalledWith('/balanzas/inactive');
    expect(result).toEqual(mockData);
  });

  it('getBalanza calls GET /balanzas/:id and unwraps the envelope', async () => {
    const mockData = { id: 3, nombre: 'Balanza 3', activo: true };
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: mockData } });

    const result = await getBalanza(3);

    expect(api.get).toHaveBeenCalledWith('/balanzas/3');
    expect(result).toEqual(mockData);
  });

  it('createBalanza calls POST /balanzas with the payload and unwraps the envelope', async () => {
    const mockData = { id: 4, nombre: 'Balanza 4', activo: true };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true, data: mockData } });

    const result = await createBalanza({ nombre: 'Balanza 4' });

    expect(api.post).toHaveBeenCalledWith('/balanzas', { nombre: 'Balanza 4' });
    expect(result).toEqual(mockData);
  });

  it('updateBalanza calls PUT /balanzas/:id with the payload and unwraps the envelope', async () => {
    const mockData = { id: 5, nombre: 'Balanza 5 editada', activo: false };
    vi.mocked(api.put).mockResolvedValueOnce({ data: { success: true, data: mockData } });

    const result = await updateBalanza(5, { nombre: 'Balanza 5 editada', activo: false });

    expect(api.put).toHaveBeenCalledWith('/balanzas/5', { nombre: 'Balanza 5 editada', activo: false });
    expect(result).toEqual(mockData);
  });

  it('deleteBalanza calls DELETE /balanzas/:id', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { success: true } });

    await deleteBalanza(6);

    expect(api.delete).toHaveBeenCalledWith('/balanzas/6');
  });
});
