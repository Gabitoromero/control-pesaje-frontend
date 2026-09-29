import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { getToleranciaConfig, updateToleranciaConfig } from './tolerancia';
import type { ToleranciaConfig } from './tolerancia';

const BASE = 'http://localhost:3000/api';

const sample: ToleranciaConfig = {
  toleranciaPct: 12.5,
  updatedAt: '2026-09-29T12:00:00.000Z',
  updatedBy: { id: 1, nombreUsuario: 'admin', nombreApellido: 'Admin Istrador' },
};

const server = setupServer();

describe('tolerancia API', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('getToleranciaConfig unwraps the { success, data } envelope', async () => {
    server.use(
      http.get(`${BASE}/configuracion/tolerancia`, () =>
        HttpResponse.json({ success: true, data: sample }),
      ),
    );

    await expect(getToleranciaConfig()).resolves.toEqual(sample);
  });

  it('getToleranciaConfig keeps a null updatedBy (initial system value)', async () => {
    server.use(
      http.get(`${BASE}/configuracion/tolerancia`, () =>
        HttpResponse.json({ success: true, data: { ...sample, toleranciaPct: 20, updatedBy: null } }),
      ),
    );

    const result = await getToleranciaConfig();
    expect(result.toleranciaPct).toBe(20);
    expect(result.updatedBy).toBeNull();
  });

  it('updateToleranciaConfig PUTs { toleranciaPct } as a number and unwraps the response', async () => {
    let receivedBody: unknown;
    server.use(
      http.put(`${BASE}/configuracion/tolerancia`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ success: true, data: sample });
      }),
    );

    const result = await updateToleranciaConfig(12.5);

    expect(receivedBody).toEqual({ toleranciaPct: 12.5 });
    expect(typeof (receivedBody as { toleranciaPct: unknown }).toleranciaPct).toBe('number');
    expect(result).toEqual(sample);
  });

  it('propagates HTTP errors', async () => {
    server.use(
      http.get(`${BASE}/configuracion/tolerancia`, () => HttpResponse.json({ success: false }, { status: 500 })),
    );

    await expect(getToleranciaConfig()).rejects.toBeTruthy();
  });
});
