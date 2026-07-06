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

export const sesionesActivasMock = [
  {
    lineaId: 1,
    lineaNombre: 'Línea 1 — Envasado A',
    usuarioId: 3,
    usuarioNombre: 'Pedro Operario',
    legajo: '333333',
    fechaInicio: '2026-07-06T10:00:00.000Z',
    expiraEn: '2026-07-06T18:00:00.000Z',
  },
];

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
  {
    id: 1, nombre: 'Ruta Alpha', descripcion: 'Descripción Alpha', activo: true,
    etapas: [
      { id: 10, etapa: { id: 1, nombre: 'Amasado' }, orden: 1, pesoMinimo: 10, pesoIdeal: 15, pesoMaximo: 20, cantidadMuestrasRequeridas: 2 },
      { id: 11, etapa: { id: 2, nombre: 'Horneado' }, orden: 2, pesoMinimo: 30, pesoIdeal: 35, pesoMaximo: 40, cantidadMuestrasRequeridas: 1 },
    ],
  },
  { id: 2, nombre: 'Ruta Beta', descripcion: null, activo: true, etapas: [] },
  { id: 3, nombre: 'Ruta Gamma', descripcion: 'Descripción Gamma', activo: true, etapas: [] },
];

export const rutasMockInactivos = [
  {
    id: 4, nombre: 'Ruta Delta', descripcion: 'Ruta inactiva D', activo: false,
    etapas: [
      { id: 40, etapa: { id: 3, nombre: 'Envasado' }, orden: 1, pesoMinimo: 5, pesoIdeal: 7, pesoMaximo: 9, cantidadMuestrasRequeridas: 3 },
    ],
  },
  { id: 5, nombre: 'Ruta Epsilon', descripcion: null, activo: false, etapas: [] },
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

  http.get(`${BASE}/auth/sesiones-activas`, () =>
    HttpResponse.json({ success: true, data: sesionesActivasMock })
  ),

  http.post(`${BASE}/auth/cerrar-sesion`, () =>
    HttpResponse.json({ success: true, data: {} })
  ),

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

  http.get(`${BASE}/rutas-pasadas/:id`, ({ params }) => {
    const id = Number(params.id);
    const found = [...rutasMock, ...rutasMockInactivos].find(r => r.id === id);
    if (!found) return HttpResponse.json({ success: false, message: 'No encontrada' }, { status: 404 });
    return HttpResponse.json({ success: true, data: found });
  }),

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

  // rutas-pasadas-articulos pivot handlers
  http.get(`${BASE}/rutas-pasadas-articulos`, ({ request }) => {
    const url = new URL(request.url);
    const rutaPasadaId = Number(url.searchParams.get('rutaPasadaId'));
    // Ruta 1 (Alpha) has Harina 000 and Azucar assigned
    const pivotsByRuta: Record<number, { id: number; articulo: { id: number; nombre: string; marca?: string } }[]> = {
      1: [
        { id: 101, articulo: { id: 1, nombre: 'Harina 000', marca: 'MarcaA' } },
        { id: 102, articulo: { id: 2, nombre: 'Azúcar', marca: 'MarcaB' } },
      ],
    };
    const data = rutaPasadaId ? (pivotsByRuta[rutaPasadaId] ?? []) : [];
    return HttpResponse.json({ success: true, data });
  }),

  http.post(`${BASE}/rutas-pasadas-articulos`, async ({ request }) => {
    const body = await request.json() as { rutaPasada: number; articulo: number };
    const articuloOption = articulosMock.find(a => a.id === body.articulo);
    const newPivot = {
      id: 999,
      articulo: { id: body.articulo, nombre: articuloOption?.nombre ?? 'Artículo', marca: articuloOption?.marca },
    };
    return HttpResponse.json({ success: true, data: newPivot }, { status: 201 });
  }),

  http.delete(`${BASE}/rutas-pasadas-articulos/:id`, () =>
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
