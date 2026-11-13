import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './axios';
import { buildPageParams } from './pagination';
import { getUsuarios, getUsuariosInactivos } from './usuarios';
import { getArticulos, getArticulosInactivos } from './articulos';
import { getEtapas, getEtapasInactivas } from './etapas';
import { getRutas, getRutasInactivas } from './rutas';
import { getLineas, getLineasInactivas } from './lineas';

vi.mock('./axios');

const page = { items: [{ id: 1 }], total: 41, page: 2, pageSize: 10 };

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: page } });
});

describe('buildPageParams', () => {
  it('drops undefined and empty values and keeps the rest', () => {
    expect(
      buildPageParams({ page: 2, pageSize: 10, q: '', searchField: undefined, sortBy: 'nombre' }),
    ).toEqual({ page: 2, pageSize: 10, sortBy: 'nombre' });
  });

  it('returns an empty object without a query', () => {
    expect(buildPageParams()).toEqual({});
  });
});

describe.each([
  ['usuarios', '/usuarios', getUsuarios, getUsuariosInactivos],
  ['articulos', '/articulos', getArticulos, getArticulosInactivos],
  ['etapas', '/etapas', getEtapas, getEtapasInactivas],
  ['rutas', '/rutas-pasadas', getRutas, getRutasInactivas],
  ['lineas', '/lineas-produccion', getLineas, getLineasInactivas],
] as const)('%s page client', (_name, path, list, listInactive) => {
  it('requests the active page with its query and returns the whole page', async () => {
    const result = await list({ page: 2, pageSize: 10, q: 'ab', sortDirection: 'desc' });

    expect(api.get).toHaveBeenCalledWith(path, {
      params: { page: 2, pageSize: 10, q: 'ab', sortDirection: 'desc' },
    });
    expect(result).toEqual(page);
  });

  it('requests the inactive page from /inactive', async () => {
    const result = await listInactive({ page: 1 });

    expect(api.get).toHaveBeenCalledWith(`${path}/inactive`, { params: { page: 1 } });
    expect(result).toEqual(page);
  });

  it('works without a query', async () => {
    await list();

    expect(api.get).toHaveBeenCalledWith(path, { params: {} });
  });
});

describe('users sector filter', () => {
  it('forwards the sector filter', async () => {
    await getUsuarios({ sector: 'sin-sector' });

    expect(api.get).toHaveBeenCalledWith('/usuarios', { params: { sector: 'sin-sector' } });
  });
});
