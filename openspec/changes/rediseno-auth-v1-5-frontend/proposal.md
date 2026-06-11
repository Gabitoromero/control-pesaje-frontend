# Proposal: Rediseño Flujo de Autenticación Frontend (v1.5)

## Intent

Adaptar el frontend React al backend v1.5 que elimina el esquema de doble autenticación. Los endpoints actuales (`/auth/activar-sesion`, payload `nombreUsuario`+`contrasena`) ya no existen. Sin este cambio, el login, la activación de línea y el interceptor global producen errores en producción.

## Scope

### In Scope
- Corregir interceptor Axios: 401 global → logout; sesión de línea expirada → datos vacíos (sin 401)
- Actualizar `Login.tsx`: un campo identificador (`legajo` o `nombreUsuario`) + campo `pin`
- Rediseñar `ActivarSesionPage`: misma UI visual, nuevo flujo con `POST /sesion-linea`
- Agregar `useActividadHeartbeat`: PATCH `/actividad` cada 2 minutos
- Expandir `AuthContext`: `activeLineaId: number | null` + `legajo: string` en `User`
- Manejar `409 SESSION_CONFLICT` en `ActivarSesionPage` mostrando la línea en conflicto
- Crear `src/api/auth.ts` con funciones tipadas para todos los endpoints de auth
- Corregir `shared/types/auth.ts`: `puedeTomarMuestrasLibres` non-optional, eliminar `lineaId`
- Corregir `TabletWorkspace.tsx`: `lineaId` desde `AuthContext`, invocar heartbeat
- Actualizar tests afectados

### Out of Scope
- Cambios en el backend
- Rediseño visual de Login o ActivarSesionPage
- Manejo de roles o permisos más allá del tipo `User`

## Capabilities

### New Capabilities
- `useActividadHeartbeat`: hook que envía heartbeat a `/actividad` cada 2 min mientras hay sesión de línea activa
- `src/api/auth.ts`: cliente tipado con `loginApi`, `abrirSesionLinea`, `actualizarActividad`, `getSesionActiva`, `cerrarSesionLinea`

### Modified Capabilities
- `axios.ts`: interceptor 401 simplificado — un 401 siempre es JWT vencido → logout global (el backend v1.5 ya no emite 401 por sesión de línea expirada)
- `AuthContext`: agrega `activeLineaId`, `legajo` en `User`, acciones `openLineSession` / `closeLineSession`
- `Login.tsx`: campo identificador único (acepta legajo o nombreUsuario) + campo pin; UI de `ActivarSesionPage` conservada
- `ActivarSesionPage`: misma UI, handlers actualizados para `POST /sesion-linea` + manejo de `409`
- `shared/types/auth.ts`: tipo `User` corregido, nuevo tipo `SesionActiva`

## Approach

Refactor completo estructurado (Approach Y). Implementar en capas de abajo hacia arriba: tipos → API client → interceptor → contexto → UI. Cada capa compila y es testeable antes de pasar a la siguiente.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/shared/types/auth.ts` | Modified | `puedeTomarMuestrasLibres` non-optional; eliminar `lineaId`; agregar `legajo`; nuevo tipo `SesionActiva` |
| `src/api/auth.ts` | New | Funciones tipadas para todos los endpoints de auth v1.5 |
| `src/api/axios.ts` | Modified | Interceptor 401 → logout global siempre (sin distinción de capas) |
| `src/features/auth/context/AuthContext.tsx` | Modified | `activeLineaId` state; `login(token)` decodifica JWT; `openLineSession` / `closeLineSession` |
| `src/pages/Login.tsx` | Modified | Campo identificador único + pin; sin `nombreUsuario` / `contrasena` |
| `src/features/tablet/pages/ActivarSesionPage.tsx` | Modified | UI conservada; handlers → `POST /sesion-linea`; manejo de `409` |
| `src/features/tablet/pages/TabletWorkspace.tsx` | Modified | `lineaId` desde `AuthContext`; invoca `useActividadHeartbeat` |
| `src/features/tablet/hooks/useActividadHeartbeat.ts` | New | Hook heartbeat con intervalo 2 minutos |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `legajo` en JWT no confirmado por backend | Medium | El campo se agrega al tipo `User`; si el backend no lo incluye en el claim, el valor será `undefined` hasta que se actualice el backend |
| Tests de `ActivarSesionPage` y `SeleccionLineaPage` rompen | High | Actualizar tests como parte de las tareas, no como seguimiento |
| Re-renders múltiples al cambiar `activeLineaId` en contexto | Low | Usar `useCallback`/`useMemo` en el provider para estabilizar referencias |

## Rollback Plan

- El cambio es exclusivamente frontend; el rollback es revertir el PR
- Los endpoints v1.5 del backend son los únicos activos — no hay rollback de backend posible sin coordinación
- Feature flag no aplicable: el cambio es de compatibilidad obligatoria con el backend ya desplegado

## Dependencies

- Backend v1.5 ya desplegado con endpoints `/auth/login`, `/auth/sesion-linea`, `PATCH /auth/actividad`
- JWT v1.5 debe incluir el claim `legajo` para que `User.legajo` esté disponible (coordinar con backend team)

## Success Criteria

- [ ] `POST /auth/login` con `{ legajo, pin }` obtiene token y el usuario queda autenticado
- [ ] Un `401` en cualquier endpoint no-auth hace logout global y redirige a `/login`
- [ ] `ActivarSesionPage` llama a `POST /sesion-linea` y navega al workspace correctamente
- [ ] Un `409` en `POST /sesion-linea` muestra la línea en conflicto al operario
- [ ] `TabletWorkspace` envía heartbeat a `/actividad` cada 2 minutos mientras está activo
- [ ] `AuthContext.activeLineaId` refleja la línea activa; se limpia al cerrar sesión de línea
- [ ] Todos los tests existentes pasan (o son actualizados con el refactor)
