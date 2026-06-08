import { http, HttpResponse } from 'msw';

export const loginMock = {
  operario: { id: 3, nombreUsuario: 'operario1', rol: 'operario' as const, puedeTomarMuestrasLibres: false },
  jefe:     { id: 2, nombreUsuario: 'jefe1',     rol: 'jefe'     as const, puedeTomarMuestrasLibres: false },
  admin:    { id: 1, nombreUsuario: 'admin',     rol: 'administrador' as const, puedeTomarMuestrasLibres: false },
};

export const articulosMock = [
  { id: 1, codigo: 'ART-001', nombre: 'Harina 000', descripcion: 'Harina de trigo tipo 000', activo: true },
  { id: 2, codigo: 'ART-002', nombre: 'Azúcar',     descripcion: 'Azúcar refinada',           activo: true },
  { id: 3, codigo: 'ART-003', nombre: 'Sal fina',   descripcion: undefined,                   activo: true },
];

export const usuariosMock = [
  { id: 1, nombreUsuario: 'admin', rol: 'administrador', activo: true },
  { id: 2, nombreUsuario: 'jefe1', rol: 'jefe', activo: true },
  { id: 3, nombreUsuario: 'operario1', rol: 'operario', activo: true, datosAdicionales: { pin: '1234' } },
  { id: 4, nombreUsuario: 'inactivo1', rol: 'operario', activo: false },
];

const BASE = 'http://localhost:3000/api';

function makeFakeJwt(payload: object): string {
  const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64url(JSON.stringify(payload))}.fakesig`;
}

export const lineasMock = [
  { id: 1, nombre: 'Línea 1 — Envasado A', estado: 'disponible' as const },
  { id: 2, nombre: 'Línea 2 — Envasado B', estado: 'ocupada' as const },
  { id: 3, nombre: 'Línea 3 — Fraccionado', estado: 'disponible' as const },
];

export const handlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { nombreUsuario: string; contrasena: string };
    const userMap: Record<string, typeof loginMock[keyof typeof loginMock]> = {
      operario1: loginMock.operario,
      jefe1:     loginMock.jefe,
      admin:     loginMock.admin,
    };
    const user = userMap[body.nombreUsuario];
    if (user) {
      return HttpResponse.json({ success: true, data: { token: makeFakeJwt(user) } });
    }
    return HttpResponse.json({ success: false, message: 'Credenciales inválidas' }, { status: 400 });
  }),

  http.post(`${BASE}/auth/activar-sesion`, async ({ request }) => {
    const body = await request.json() as { legajo: string; pin: string; lineaProduccionId: number };
    if (body.legajo === '999999' || body.pin === '9999') {
      return HttpResponse.json({ success: false, message: 'PIN o legajo incorrecto' }, { status: 400 });
    }
    return HttpResponse.json({ success: true, data: { sessionActive: true } });
  }),


  http.get(`${BASE}/lineas-produccion`, () =>
    HttpResponse.json({ success: true, data: lineasMock })
  ),


  http.get(`${BASE}/articulos`, () =>
    HttpResponse.json({ success: true, data: articulosMock })
  ),

  http.post(`${BASE}/articulos`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: { id: 99, activo: true, ...body } }, { status: 201 });
  }),

  http.put(`${BASE}/articulos/:id`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: { activo: true, ...body } });
  }),

  http.delete(`${BASE}/articulos/:id`, () =>
    new HttpResponse(null, { status: 204 })
  ),

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
