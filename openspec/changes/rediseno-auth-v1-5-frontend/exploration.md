# Exploration: Refactor del Flujo de Autenticación de Doble Capa — Frontend React (v1.5)

**Date:** 2026-06-09
**Change:** rediseno-auth-v1-5-frontend
**Artifact store:** openspec (file-based)
**Backend context:** `backend/openspec/changes/archive/2026-06-09-rediseno-auth-v1-5-backend/`

---

## Current State

### Stack confirmado (`package.json`)

| Dep | Versión |
|-----|---------|
| React | 19.2.6 |
| react-router-dom | 7.15.1 |
| @tanstack/react-query | 5.100.14 |
| axios | 1.16.1 |
| js-cookie | 3.0.8 |
| TypeScript | ~6.0.2 |
| Vitest | 4.1.8 |
| zod | 4.4.3 |

### Árbol de archivos clave

```
frontend/src/
├── api/
│   └── axios.ts                           ← EL PROBLEMA CENTRAL
├── features/
│   ├── auth/
│   │   └── context/
│   │       └── AuthContext.tsx            ← estado global de auth
│   └── tablet/
│       ├── hooks/
│       │   ├── useBalanzaWebSocket.ts
│       │   └── usePasadaState.ts
│       └── pages/
│           ├── ActivarSesionPage.tsx      ← llama al endpoint eliminado
│           ├── SeleccionLineaPage.tsx
│           └── TabletWorkspace.tsx
├── pages/
│   └── Login.tsx                          ← envía nombreUsuario+contrasena (obsoleto)
├── shared/
│   ├── types.ts                           ← UsuarioRol enum
│   └── types/
│       ├── auth.ts                        ← User, AuthResponse
│       ├── domain.ts
│       └── index.ts
├── layouts/
│   ├── TabletLayout.tsx
│   └── DashboardLayout.tsx
└── App.tsx                                ← rutas protegidas
```

---

## Problemas Concretos Encontrados

### Problema 1 — `axios.ts`: interceptor destruye el JWT en cualquier 401

```typescript
// CÓDIGO ACTUAL — axios.ts L23-29
if (error.response?.status === 401 && !isAuthEndpoint) {
  Cookies.remove('token');           // ← DESTRUYE el JWT global
  localStorage.removeItem('user');
  window.location.href = '/login';  // ← REDIRIGE AL LOGIN GLOBAL
}
```

**Por qué es un bug en v1.5:** El backend devuelve `401` desde `GET /sesion-activa/:lineaId` cuando la sesión de línea expiró por inactividad. El interceptor actual trata ese 401 exactamente igual que un JWT vencido → destruye la sesión completa del operario y lo manda al login de sistema, cuando en realidad solo debería mostrar la pantalla de PIN de nuevo.

**El interceptor no distingue entre:**
- `401` de Capa 1 → JWT vencido o ausente → sí debe hacer logout global
- `401` de Capa 2 → sesión de línea expirada → solo debe redirigir a `/tablet/activar-sesion` (o a una nueva ruta de PIN)

### Problema 2 — `ActivarSesionPage.tsx`: llama a un endpoint eliminado

```typescript
// CÓDIGO ACTUAL — ActivarSesionPage.tsx L50
await api.post('/auth/activar-sesion', { lineaProduccionId: lineaId, legajo, pin });
```

El backend v1.5 eliminó `/auth/activar-sesion` (devuelve 404). El nuevo flujo es:
1. `POST /auth/login` con `{ legajo, pin }` → obtiene JWT  
2. `POST /auth/sesion-linea` con `{ lineaProduccionId }` → abre sesión de línea

**Implicación arquitectural crítica:** En v1.5, el operario SIEMPRE debe pasar por login antes de usar la tablet. No hay "ya estoy logueado, solo confirmo PIN". El JWT global es el único mecanismo de identidad. Esto cambia el flujo completo de `ActivarSesionPage`.

### Problema 3 — `Login.tsx`: envía payload obsoleto

```typescript
// CÓDIGO ACTUAL — Login.tsx L27-29
await api.post('/auth/login', {
  nombreUsuario: username,  // ← campo eliminado del backend
  contrasena: password,     // ← campo eliminado del backend
});
```

El backend v1.5 espera `{ legajo, pin }`. El label "Contraseña" del input también es incorrecto.

### Problema 4 — `shared/types/auth.ts`: tipo `User` incompleto

```typescript
// CÓDIGO ACTUAL — auth.ts
export interface User {
  id: number;
  nombreUsuario: string;
  rol: UsuarioRol;
  puedeTomarMuestrasLibres?: boolean;  // ← opcional cuando debería ser boolean
  lineaId?: number;                    // ← no está en el JWT del backend v1.5
}
```

El JWT v1.5 contiene `{ id, nombreUsuario, rol, puedeTomarMuestrasLibres: boolean }`. `puedeTomarMuestrasLibres` ahora es un claim explícito (no opcional). `lineaId` NO está en el JWT — la sesión de línea vive en el backend, no en el token.

### Problema 5 — `TabletWorkspace.tsx`: `lineaId` tomado del user (incorrecto)

```typescript
// CÓDIGO ACTUAL — TabletWorkspace.tsx L22
const lineaId = user?.lineaId ?? 1;  // ← lineaId no está en el JWT v1.5
```

En v1.5 no hay `lineaId` en el payload del JWT. El `lineaId` activo debe provenir del estado de navegación (pasado via `location.state` como ya hace `ActivarSesionPage`) o desde un estado de contexto dedicado a la sesión de línea.

### Problema 6 — Sin heartbeat de actividad

No existe ningún hook o timer que llame a `PATCH /api/auth/actividad`. El backend expira la sesión de línea después de 5 minutos de inactividad (lazy check). Sin heartbeat, el operario puede perder la sesión en medio de una pasada.

### Problema 7 — Sin manejo del error 409 SESSION_CONFLICT

Ningún componente maneja el `409 Conflict` que devuelve `POST /sesion-linea` cuando el operario ya está en otra línea. El backend devuelve:
```json
{ "error": { "code": "SESSION_CONFLICT", "data": { "lineaProduccionId": 3 } } }
```
Esto debe mostrarse con un mensaje útil al usuario.

---

## Affected Areas

| Archivo | Razón |
|---------|-------|
| `src/api/axios.ts` | Interceptor 401 no distingue Capa 1 vs Capa 2 |
| `src/pages/Login.tsx` | Payload obsoleto `nombreUsuario`+`contrasena` |
| `src/features/auth/context/AuthContext.tsx` | `login()` y tipo `User`, posible nuevo estado de sesión de línea |
| `src/shared/types/auth.ts` | `User.puedeTomarMuestrasLibres` debe ser `boolean` (no opcional); `lineaId` debe eliminarse o mantenerse como estado local |
| `src/features/tablet/pages/ActivarSesionPage.tsx` | Llama al endpoint eliminado; flujo completo a rediseñar |
| `src/features/tablet/pages/SeleccionLineaPage.tsx` | El "Salir" navega a logout global; puede necesitar ajuste de flujo |
| `src/features/tablet/pages/TabletWorkspace.tsx` | `lineaId` tomado del user (incorrecto); necesita heartbeat |
| `src/api/` | Nuevas funciones para `sesion-linea`, `actividad`, `sesion-activa` |
| `App.tsx` | Ruta `/tablet/activar-sesion` puede quedar igual en path pero su componente cambia completamente |

**Nuevo archivo a crear:**
- `src/features/tablet/hooks/useActividadHeartbeat.ts`

---

## Análisis de los 6 Puntos Clave

### Punto 1 — Interceptor de Axios: distinción Capa 1 vs Capa 2

**El problema central es que el interceptor no sabe si el 401 vino de un endpoint de "sesión de línea" o de cualquier otro endpoint protegido.**

**Approach A — Distinguir por URL pattern (recomendado)**

Agregar una lista de URLs que son "Capa 2" y cuyo 401 NO debe triggerear logout global:

```typescript
const LAYER2_ENDPOINTS = [
  '/auth/sesion-activa',
  '/auth/sesion-linea',
  '/auth/actividad',
  '/auth/cerrar-sesion',
];

const isLayer2Endpoint = LAYER2_ENDPOINTS.some(path =>
  error.config?.url?.includes(path)
);

if (error.response?.status === 401) {
  if (isLayer2Endpoint) {
    // Solo redirigir a PIN local, NO borrar JWT
    window.location.href = '/tablet/activar-sesion';
  } else if (!isAuthEndpoint) {
    // JWT global vencido → logout completo
    Cookies.remove('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}
```

- Pros: simple, no requiere cambios de arquitectura
- Cons: acoplamiento por string de URL en el interceptor; si cambia la ruta del backend, hay que actualizar aquí

**Approach B — Custom Axios instance para Capa 2**

Crear `api` (Capa 1) y `apiLinea` (Capa 2) como dos instancias separadas con interceptores distintos.

- Pros: separación limpia
- Cons: duplicación de configuración; los componentes deben saber qué instancia usar

**Decisión:** Approach A. La lista de endpoints es pequeña, estable, y el approach es el más claro para un equipo pequeño. Se puede extraer la lista como constante con un comentario explicativo.

### Punto 2 — API client: nuevas funciones

Agregar en `src/api/` (o `src/api/auth.ts` si se quiere separar):

```typescript
// POST /auth/login → retorna { token, user }
export const loginApi = (legajo: string, pin: string) =>
  api.post<{ success: true; data: { token: string } }>('/auth/login', { legajo, pin });

// POST /auth/sesion-linea → abre sesión de línea
export const abrirSesionLinea = (lineaProduccionId: number) =>
  api.post<{ success: true; data: SesionActiva }>('/auth/sesion-linea', { lineaProduccionId });

// PATCH /auth/actividad → reset heartbeat
export const actualizarActividad = (lineaProduccionId: number) =>
  api.patch<{ success: true; data: { ultimaActividadAt: string } }>('/auth/actividad', { lineaProduccionId });

// GET /auth/sesion-activa/:lineaId → consultar sesión activa
export const getSesionActiva = (lineaId: number) =>
  api.get<{ success: true; data: SesionActiva }>(`/auth/sesion-activa/${lineaId}`);

// POST /auth/cerrar-sesion → cierra sesión de línea (ya existe en AuthContext)
export const cerrarSesionLinea = (lineaProduccionId: number) =>
  api.post('/auth/cerrar-sesion', { lineaProduccionId });
```

**Dónde ubicarlas:** Crear `src/api/auth.ts` como módulo dedicado. Mantener `src/api/axios.ts` solo como instancia base + interceptores.

### Punto 3 — AuthContext: tipo User y login()

**Cambios en `User`:**
```typescript
export interface User {
  id: number;
  nombreUsuario: string;
  rol: UsuarioRol;
  puedeTomarMuestrasLibres: boolean;  // ← ya no opcional (claim explícito en JWT)
  legajo: string;                     // ← NUEVO: viene en el JWT v1.5? 
}
```

**OPEN QUESTION sobre `legajo` en JWT:** El backend spec de v1.5 dice que el JWT contiene `{ id, nombreUsuario, rol, puedeTomarMuestrasLibres }`. El campo `legajo` NO está en el payload del JWT según el spec (`JWTPayload` backend no lo incluye). Sin embargo, el operario usa su legajo para ingresar. El `legajo` se necesita en el frontend solo para mostrar quién está activo o para logging. 

**Decisión recomendada para `legajo`:** No agregarlo al tipo `User` si no viene en el JWT. El `legajo` que el usuario escribe en `ActivarSesionPage` puede pasarse via `location.state` al workspace si se necesita mostrar. Agregar solo si el backend lo agrega al JWT (fuera de scope de este análisis — verificar con el equipo de backend).

**Cambios en `login()`:**

El método actual recibe un `AuthResponse` con `{ token, user }`. En v1.5 el backend devuelve `{ token }` solamente, sin `user`. El `user` se extrae del JWT decodificado (como ya hace `Login.tsx` actualmente). La firma de `login()` puede quedar igual pero el llamador debe asegurarse de decodificar el JWT primero.

**Alternativa limpia:** hacer que `login()` reciba solo el `token` y decodifique internamente:

```typescript
const login = (token: string) => {
  const payloadB64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const user = JSON.parse(atob(payloadB64)) as User;
  setToken(token);
  setUser(user);
  // persist...
};
```

Esto centraliza la decodificación en un solo lugar. Si `AuthResponse` se mantiene por compatibilidad, mantener `login(data: AuthResponse)` pero internamente ignorar `data.user` y redecodificar del token.

**Estado de sesión de línea en AuthContext:**

En v1.5, la sesión de línea es un concepto separado del JWT. El `lineaId` activo no viene en el token. Opciones:

- **Opción A:** `AuthContext` solo maneja la Capa 1 (JWT). La Capa 2 se maneja con estado local en los componentes de tablet (ej. `location.state`).
- **Opción B:** Agregar al `AuthContext` un estado `activeLineaId: number | null` para que `TabletWorkspace` sepa en qué línea está sin depender de `user.lineaId`.

**Recomendación:** Opción B — mantener `activeLineaId` en `AuthContext` es más limpio que pasarlo por `location.state` a través de múltiples niveles. Se setea al completar `POST /sesion-linea` y se limpia al cerrar sesión de línea.

### Punto 4 — Heartbeat de actividad

**Opciones evaluadas:**

**Approach A — `useEffect` con `setInterval` en `TabletWorkspace`**
- Pros: co-localizado con el componente que lo necesita, simple
- Cons: si el workspace se desmonta y remonta (ej. navegación), el intervalo se recrea
- Viable para este caso porque el workspace no se navega internamente

**Approach B — Hook dedicado `useActividadHeartbeat(lineaId, intervalMs)`**
```typescript
// src/features/tablet/hooks/useActividadHeartbeat.ts
export function useActividadHeartbeat(lineaId: number | null, intervalMs = 60_000) {
  useEffect(() => {
    if (!lineaId) return;
    const id = setInterval(() => {
      actualizarActividad(lineaId).catch(console.error);
    }, intervalMs);
    return () => clearInterval(id);
  }, [lineaId, intervalMs]);
}
```
- Pros: reutilizable, testeable en aislamiento, no contamina el workspace con lógica de heartbeat
- Cons: requiere un archivo más

**Approach C — En `AuthContext` como efecto**
- Cons: el contexto no sabe si el usuario está activo en el workspace o solo mirando el dashboard; causaría heartbeats innecesarios

**Decisión: Approach B** — `useActividadHeartbeat` como hook dedicado, invocado desde `TabletWorkspace`. El intervalo por defecto de 60 segundos (bien dentro del umbral de 5 minutos del backend). El hook se corta automáticamente si `lineaId` es `null`.

**Nota sobre el intervalo:** El backend expira después de 5 minutos sin actividad. Un heartbeat cada 60 segundos es conservador y correcto. Podría ser hasta 4 minutos, pero 60s es más seguro ante latencia de red.

### Punto 5 — Flujo de activación de línea: nuevo diseño

**Flujo actual (obsoleto):**
1. Operario navega a `/tablet/seleccion-linea` (ya tiene JWT)
2. Elige línea → navega a `/tablet/activar-sesion`
3. `ActivarSesionPage` pide legajo + PIN → llama a `/auth/activar-sesion` (eliminado)

**Nuevo flujo v1.5:**

El cambio fundamental es que **el operario SIEMPRE debe tener un JWT antes de abrir sesión de línea**. En la arquitectura v1.5, el JWT es el único mecanismo de identidad. La pantalla de "activar sesión" ya no es un "segundo factor" — es el login completo del operario.

**Dos sub-casos:**

**Sub-caso A — Operario en tablet física (sin login previo):**
- La tablet arranca sin JWT (cookie vacía)
- El operario se loguea desde `/login` con legajo + PIN → obtiene JWT → navega a selección de línea → elige línea → llama a `POST /sesion-linea`

**Sub-caso B — Operario con JWT vigente que quiere cambiar de línea:**
- Ya tiene JWT (12h de duración)
- Va a `/tablet/seleccion-linea` → elige línea → llama a `POST /sesion-linea`
- Si ya tiene sesión en otra línea → recibe `409 SESSION_CONFLICT`

**Implicación para `ActivarSesionPage`:**

El componente actual pide legajo + PIN para verificar PIN. En v1.5, si el operario ya tiene JWT, la página puede ir directo a `POST /sesion-linea` con el `lineaId`. El componente puede simplificarse a:

**Nuevo comportamiento de `ActivarSesionPage`:**
1. Si hay JWT → directamente llama `POST /sesion-linea` al cargar (o al confirmar)
2. Si NO hay JWT → redirige a `/login`

La pantalla de "ingresá legajo y PIN" en tablet ya no es necesaria como pantalla separada — el login global lo reemplaza. Sin embargo, la UI puede mantenerse como confirmación visual ("Vas a trabajar en Línea X — Confirmar") antes de llamar a `/sesion-linea`.

**Recomendación:** simplificar `ActivarSesionPage` a una pantalla de confirmación que llama a `POST /sesion-linea`. El paso de "ingresar legajo + PIN" se elimina porque ya se hizo en el login global.

### Punto 6 — SESSION_CONFLICT (409)

El backend devuelve:
```json
{
  "success": false,
  "error": {
    "code": "SESSION_CONFLICT",
    "message": "User already has an active session on another line",
    "data": { "lineaProduccionId": 3 }
  }
}
```

**Dónde manejarlo:** en `ActivarSesionPage` al hacer `POST /sesion-linea`.

**UX recomendada:**
```
⚠️ Ya tenés una sesión activa en otra línea (Línea 3).
Para continuar en esta línea, primero cerrá la sesión de la Línea 3.
[Cancelar] [Ir a Línea 3]
```

El botón "Ir a Línea 3" puede navegar a `/tablet` con `state: { lineaId: 3 }` para llevar al operario al workspace correcto, o simplemente navegar a `/tablet/seleccion-linea` para que elija de nuevo.

---

## Approaches para el Rediseño Global

### Approach X — Refactor mínimo (patch surgical)

Tocar solo los archivos con bugs directos:
1. `axios.ts` → distinguir 401 por URL
2. `Login.tsx` → cambiar payload a `legajo` + `pin`
3. `ActivarSesionPage.tsx` → cambiar llamada al endpoint nuevo
4. `shared/types/auth.ts` → arreglar `puedeTomarMuestrasLibres`
5. `TabletWorkspace.tsx` → arreglar `lineaId`

- Pros: mínimo riesgo, rápido
- Cons: no resuelve el heartbeat, no crea el `api/auth.ts` limpio, `lineaId` queda sin solución elegante

### Approach Y — Refactor completo estructurado (recomendado)

Atacar todo de forma coordinada:
1. **`axios.ts`** → interceptor con distinción Layer 1/Layer 2
2. **`src/api/auth.ts`** → cliente de API tipado para todos los endpoints de auth
3. **`shared/types/auth.ts`** → User corregido + nuevo tipo `SesionActiva`
4. **`AuthContext.tsx`** → `activeLineaId` state + nuevo `login(token)` + `openLineSession(lineaId)` + `closeLineSession(lineaId)`
5. **`Login.tsx`** → payload correcto, label "PIN" en vez de "Contraseña"
6. **`ActivarSesionPage.tsx`** → rediseñado como pantalla de confirmación (sin legajo/PIN)
7. **`TabletWorkspace.tsx`** → `lineaId` desde context, invocar `useActividadHeartbeat`
8. **`useActividadHeartbeat.ts`** → nuevo hook

- Pros: coherente, testeable, sin deuda técnica residual
- Cons: más archivos tocados (estimado ~8 archivos)

---

## Recommendation

**Approach Y — Refactor completo estructurado.**

El approach mínimo dejaría deuda técnica que garantizaría bugs en producción (`lineaId` sin fuente de verdad, sin heartbeat, sin 409 handling). El costo de hacerlo bien ahora es bajo comparado con los bugs que evita.

**Orden de implementación sugerido:**
1. Tipos (`shared/types/auth.ts`) — base de todo
2. `src/api/auth.ts` — cliente tipado
3. `axios.ts` — interceptor corregido
4. `AuthContext.tsx` — estado expandido + nuevas acciones
5. `Login.tsx` — payload correcto
6. `ActivarSesionPage.tsx` — flujo nuevo
7. `TabletWorkspace.tsx` + `useActividadHeartbeat`

---

## Risks

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| `legajo` no está en JWT v1.5 | MEDIO | Confirmar con backend si necesita agregarse al claim; si no, removarlo de `User` |
| Heartbeat sin cleanup correcto en re-renders | BAJO | El hook `useActividadHeartbeat` hace cleanup en el return de `useEffect` |
| `ActivarSesionPage` ya no pide PIN — regresión de UX para operarios | MEDIO | Documentar en UX que el login global reemplaza la confirmación; evaluar si se necesita un mensaje en la pantalla de confirmación |
| Tests existentes en `ActivarSesionPage.test.tsx` y `SeleccionLineaPage.test.tsx` van a romper | ALTO | Actualizar tests como parte de la tarea, no después |
| El interceptor redirige a `/tablet/activar-sesion` sin state (lineaId se pierde) | MEDIO | La redirección desde el interceptor debe incluir state o usar un evento global; evaluar si la pantalla puede obtener el lineaId desde el context |

---

## Ready for Proposal

**Sí.** El análisis está completo. Los 6 puntos de la exploración tienen decisión o recomendación clara. El orchestrator puede proceder con `sdd-propose` usando como input:
- Approach Y (refactor completo)
- Orden de implementación definido
- 8 archivos afectados identificados (más 1 nuevo hook)
- Risks documentados
