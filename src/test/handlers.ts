import { http, HttpResponse } from 'msw';

export const loginMock = {
  operario: { id: 3, nombreUsuario: 'operario1', rol: 'operario' as const, puedeTomarMuestrasLibres: false },
  jefe:     { id: 2, nombreUsuario: 'jefe1',     rol: 'jefe'     as const, puedeTomarMuestrasLibres: false },
  admin:    { id: 1, nombreUsuario: 'admin',     rol: 'administrador' as const, puedeTomarMuestrasLibres: false },
};

export const articulosMock = [
  { id: 1, marca: 'MarcaA', nombre: 'Harina 000', descripcion: 'Harina de trigo tipo 000', activo: true },
  { id: 2, marca: 'MarcaB', nombre: 'Azúcar',     descripcion: 'Azúcar refinada',           activo: true },
  { id: 3, marca: 'MarcaC', nombre: 'Sal fina',   descripcion: undefined,                   activo: true },
];

export const articulosMockInactivos = [
  { id: 4, marca: 'MarcaD', nombre: 'Levadura seca', descripcion: 'Levadura inactiva', activo: false },
  { id: 5, marca: 'MarcaE', nombre: 'Manteca',       descripcion: undefined,           activo: false },
];

export const usuariosMock = [
  { id: 1, nombreApellido: 'Admin Istrador', nombreUsuario: 'admin',     rol: 'administrador', activo: true, puedeTomarMuestrasLibres: false, legajo: '111111' },
  { id: 2, nombreApellido: 'José Jefe',      nombreUsuario: 'jefe1',     rol: 'jefe',          activo: true, puedeTomarMuestrasLibres: false, legajo: '222222' },
  { id: 3, nombreApellido: 'Pedro Operario', nombreUsuario: 'operario1', rol: 'operario',      activo: true, puedeTomarMuestrasLibres: true,  legajo: '333333', pin: '1234' },
];

export const usuariosMockInactivos = [
  { id: 4, nombreApellido: 'Juan Inactivo', nombreUsuario: 'inactivo1', rol: 'operario', activo: false, puedeTomarMuestrasLibres: false, legajo: '444444' },
];

export const etapasMock = [
  { id: 1, nombre: 'Amasado', descripcion: 'Proceso de amasado', activo: true },
  { id: 2, nombre: 'Horneado', descripcion: 'Proceso de horneado', activo: true },
  { id: 3, nombre: 'Envasado', descripcion: 'Proceso de envasado', activo: true },
];

export const etapasMockInactivos = [
  { id: 4, nombre: 'Reposo', descripcion: 'Reposo inactivo', activo: false },
  { id: 5, nombre: 'Corte', descripcion: 'Corte inactivo', activo: false },
];

const BASE = 'http://localhost:3000/api';

function makeFakeJwt(payload: object): string {
  const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64url(JSON.stringify(payload))}.fakesig`;
}

export const lineasMock = [
  { id: 1, nombre: 'Línea 1 — Envasado A', estado: 'disponible' as const, activo: true, numeroBalanza: 1 },
  { id: 2, nombre: 'Línea 2 — Envasado B', estado: 'ocupada' as const,    activo: true, numeroBalanza: 2 },
  { id: 3, nombre: 'Línea 3 — Fraccionado', estado: 'disponible' as const, activo: true, numeroBalanza: 3 },
];

export const lineasMockInactivos = [
  { id: 4, nombre: 'Línea 4 — Inactiva A', activo: false, numeroBalanza: 4 },
  { id: 5, nombre: 'Línea 5 — Inactiva B', activo: false, numeroBalanza: 5 },
];

export const rutasMock = [
  { id: 1, nombre: 'Ruta Alpha',   descripcion: 'Descripción Alpha', activo: true },
  { id: 2, nombre: 'Ruta Beta',    descripcion: null,                activo: true },
  { id: 3, nombre: 'Ruta Gamma',   descripcion: 'Descripción Gamma', activo: true },
];

export const rutasMockInactivos = [
  { id: 4, nombre: 'Ruta Delta',   descripcion: 'Ruta inactiva D', activo: false },
  { id: 5, nombre: 'Ruta Epsilon', descripcion: null,              activo: false },
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

  http.post(`${BASE}/auth/sesion-linea`, () => {
    return HttpResponse.json({ success: true, data: { sessionActive: true } });
  }),


  http.get(`${BASE}/lineas-produccion`, () =>
    HttpResponse.json({ success: true, data: lineasMock })
  ),


  http.get(`${BASE}/articulos`, () =>
    HttpResponse.json({ success: true, data: articulosMock })
  ),

  http.get(`${BASE}/articulos/inactive`, () =>
    HttpResponse.json({ success: true, data: articulosMockInactivos })
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

  http.get(`${BASE}/usuarios/inactive`, () =>
    HttpResponse.json({ success: true, data: usuariosMockInactivos })
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

  http.get(`${BASE}/etapas`, () =>
    HttpResponse.json({ success: true, data: etapasMock })
  ),

  http.get(`${BASE}/etapas/inactive`, () =>
    HttpResponse.json({ success: true, data: etapasMockInactivos })
  ),

  http.post(`${BASE}/etapas`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: { id: 99, activo: true, ...body } }, { status: 201 });
  }),

  http.put(`${BASE}/etapas/:id`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: { activo: true, ...body } });
  }),

  http.delete(`${BASE}/etapas/:id`, () =>
    new HttpResponse(null, { status: 204 })
  ),

  // rutas-pasadas handlers
  http.get(`${BASE}/rutas-pasadas`, () =>
    HttpResponse.json({ success: true, data: rutasMock })
  ),

  http.get(`${BASE}/rutas-pasadas/inactive`, () =>
    HttpResponse.json({ success: true, data: rutasMockInactivos })
  ),

  http.post(`${BASE}/rutas-pasadas`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: { id: 99, activo: true, ...body } }, { status: 201 });
  }),

  http.put(`${BASE}/rutas-pasadas/:id`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: { activo: true, ...body } });
  }),

  http.delete(`${BASE}/rutas-pasadas/:id`, () =>
    new HttpResponse(null, { status: 204 })
  ),

  // lineas-produccion ABM handlers (GET active already exists above)
  http.get(`${BASE}/lineas-produccion/inactive`, () =>
    HttpResponse.json({ success: true, data: lineasMockInactivos })
  ),

  http.post(`${BASE}/lineas-produccion`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: { id: 99, activo: true, ...body } }, { status: 201 });
  }),

  http.put(`${BASE}/lineas-produccion/:id`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: { activo: true, ...body } });
  }),

  http.delete(`${BASE}/lineas-produccion/:id`, () =>
    new HttpResponse(null, { status: 204 })
  ),
];
