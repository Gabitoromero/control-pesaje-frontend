import { http, HttpResponse } from 'msw';

export const usuariosMock = [
  { id: 1, nombreUsuario: 'admin', rol: 'administrador', activo: true },
  { id: 2, nombreUsuario: 'jefe1', rol: 'jefe', activo: true },
  { id: 3, nombreUsuario: 'operario1', rol: 'operario', activo: true, datosAdicionales: { pin: '1234' } },
  { id: 4, nombreUsuario: 'inactivo1', rol: 'operario', activo: false },
];

const BASE = 'http://localhost:3000/api';

export const handlers = [
  http.get(`${BASE}/usuarios`, () =>
    HttpResponse.json({ success: true, data: usuariosMock })
  ),

  http.post(`${BASE}/usuarios`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: { id: 99, activo: true, ...body } }, { status: 201 });
  }),

  http.put(`${BASE}/usuarios/:id`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: { activo: true, ...body } });
  }),

  http.delete(`${BASE}/usuarios/:id`, () =>
    new HttpResponse(null, { status: 204 })
  ),
];
