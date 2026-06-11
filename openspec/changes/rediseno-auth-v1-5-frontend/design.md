# Design: Rediseño Flujo de Autenticación Frontend (v1.5)

## Technical Approach

Refactor de abajo hacia arriba en 5 capas: **tipos → API client → interceptor → contexto → UI**.
Cada capa es independently compilable y testeable antes de tocar la siguiente.
El cambio es de compatibilidad obligatoria: los endpoints viejos ya no existen en el backend desplegado.

## Architecture Decisions

### Decision: JWT decoding en Login — usar `user` del body de respuesta

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Decode JWT manual (patrón actual) | Frágil; `legajo` no disponible | ❌ Eliminar |
| Usar `user` del body de `/auth/login` | Backend v1.5 ya lo devuelve con `legajo` | ✅ Adoptar |

**Rationale**: el body ya contiene `{ token, user }` con `legajo`. Elimina el `atob` manual en `Login.tsx`.

### Decision: `activeLineaId` en AuthContext vía state

| Option | Tradeoff | Decision |
|--------|----------|----------|
| JWT claim | Stale hasta refresh | ❌ |
| `useState<number \| null>` | Runtime truth; se limpia en logout | ✅ |
| localStorage | Riesgo de stale entre recargas | ❌ |

**Rationale**: Capa 2 es independiente del JWT. En memoria; al recargar `ActivarSesionPage` re-autentica.

### Decision: Interceptor 401 — logout global sin distinción de capas

| Option | Tradeoff | Decision |
|--------|----------|----------|
| 401 = logout global | Backend v1.5 nunca emite 401 por sesión de línea | ✅ |
| Guard `!isAuthEndpoint` (actual) | Innecesario en v1.5 | ❌ Eliminar |

**Rationale**: lazy expiry de línea devuelve 200 vacío, no 401. El guard se elimina.

### Decision: `useActividadHeartbeat` — `setInterval` + `useEffect` cleanup

**Choice**: hook custom; `setInterval` 2 min; solo activo si `lineaId != null`; cleanup en unmount.
**Rationale**: el proyecto no usa utilidades externas. Testeable con `vi.useFakeTimers()`.

### Decision: logout en axios vía setter (evitar ciclo circular)

**Choice**: `setLogoutHandler(fn)` exportada de `axios.ts`; `AuthProvider` la registra al montar.
**Rationale**: axios no puede importar `AuthContext` sin ciclo. El setter es el patrón mínimo.

## Data Flow

```
Login form (legajo + pin)
    │  POST /auth/login { legajo, pin }
    ▼
api (axios.ts) ──→ Backend v1.5
    │  { token, user: { id, legajo, rol, puedeTomarMuestrasLibres } }
    ▼
AuthContext.login(token, user)
    │  Cookies.set('token') + localStorage.set('user')
    ▼
navigate('/tablet/seleccion-linea') [operario] | navigate('/dashboard') [otros]
    │
    ▼ [operario elige línea]
ActivarSesionPage (legajo + pin keypad)
    │  POST /auth/sesion-linea { lineaProduccionId, legajo, pin }
    │  409 → muestra mensaje con línea en conflicto
    ▼
AuthContext.openLineSession(lineaId)  ←  activeLineaId = lineaId
    │
    ▼
TabletWorkspace
    ├── useActividadHeartbeat(activeLineaId)  → PATCH /auth/actividad cada 2 min
    └── "Salir" → AuthContext.closeLineSession(lineaId)
                    │  POST /auth/cerrar-sesion { lineaProduccionId }
                    └─ activeLineaId = null → navigate('/tablet/seleccion-linea')
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/shared/types/auth.ts` | Modify | `legajo: string` requerido; eliminar `lineaId?`; `puedeTomarMuestrasLibres` non-optional; agregar tipo `SesionActiva` |
| `src/api/auth.ts` | Create | `loginApi`, `abrirSesionLinea`, `actualizarActividad`, `getSesionActiva`, `cerrarSesionLinea` tipadas sobre `api` |
| `src/api/axios.ts` | Modify | Eliminar guard `!isAuthEndpoint`; 401 → `_logout?.()` vía setter exportado |
| `src/features/auth/context/AuthContext.tsx` | Modify | `activeLineaId` state; `openLineSession`/`closeLineSession`; `login(token, user)` usa `user` del body; registra `setLogoutHandler` al montar |
| `src/pages/Login.tsx` | Modify | Campos `legajo` + `pin`; eliminar decode JWT; usar `loginApi`; navegar por `user.rol` |
| `src/features/tablet/pages/ActivarSesionPage.tsx` | Modify | `handleActivar` → `abrirSesionLinea`; `409` muestra línea en conflicto; llama `openLineSession` tras éxito |
| `src/features/tablet/pages/TabletWorkspace.tsx` | Modify | `lineaId` desde `AuthContext.activeLineaId`; invocar `useActividadHeartbeat` |
| `src/features/tablet/hooks/useActividadHeartbeat.ts` | Create | `setInterval` 2 min sobre `actualizarActividad`; inactivo si `lineaId` es null |
| `src/features/tablet/pages/ActivarSesionPage.test.tsx` | Modify | Handler MSW → `/auth/sesion-linea`; test de 409 con mensaje de conflicto |
| `src/pages/Login.test.tsx` | Modify | Payload `{ legajo, pin }`; handler MSW correcto |
| `src/features/auth/context/AuthContext.test.tsx` | Modify | Cubrir `activeLineaId`, `openLineSession`, `closeLineSession` |

## Interfaces / Contracts

```typescript
// auth.ts — User
export interface User {
  id: number; legajo: string; nombreUsuario: string;
  rol: UsuarioRol; puedeTomarMuestrasLibres: boolean;
}
export interface SesionActiva {
  lineaProduccionId: number; usuarioId: number | null;
  usuarioRol: UsuarioRol | null; ultimaActividadAt: string | null;
}

// AuthContextType — additions / replacements
activeLineaId: number | null;
openLineSession: (lineaId: number) => void;
closeLineSession: (lineaId: number) => Promise<void>;
// Removed: deactivateLayer2Session

// axios.ts — avoids circular import
export const setLogoutHandler = (fn: () => void) => { _logout = fn; };
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `useActividadHeartbeat`: llama API cada 2 min; para cuando `lineaId` es null | Vitest + `vi.useFakeTimers()` |
| Integration | `ActivarSesionPage`: flujo éxito + 409 muestra conflicto | RTL + MSW handler `/auth/sesion-linea` |
| Integration | `Login`: payload `{ legajo, pin }`, navega por rol | RTL + MSW |
| Integration | `AuthContext`: `activeLineaId` setea/limpia; `closeLineSession` llama API | RTL |
| Integration | `axios.ts`: 401 dispara `_logout` | Vitest + spy sobre setter |

## Migration / Rollout

No migration required. El backend v1.5 ya está desplegado y es la única versión activa. El rollback es revertir el PR de frontend. No hay feature flag: el cambio es de compatibilidad obligatoria.

## Open Questions

- [ ] Confirmar que `POST /auth/login` devuelve `user.legajo` en el body (no solo en el JWT claim). El diseño asume que sí — si no, hay que decodificar el JWT en Login como fallback.
- [ ] Definir comportamiento al recargar `TabletWorkspace` con `activeLineaId = null` (se pierde en memoria): ¿redirigir automáticamente a `ActivarSesionPage` o llamar `GET /sesion-activa` para recuperar estado del backend?
