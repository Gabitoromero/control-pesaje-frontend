# Tasks: Rediseño Flujo de Autenticación Frontend (v1.5)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 300-350 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Refactor Auth Flow | PR 1 | Base branch; tests/docs included |

## Phase 1: Foundation / Infrastructure

- [ ] 1.1 Modificar `src/shared/types/auth.ts` para agregar `legajo` a `User`, eliminar `lineaId`, y crear `SesionActiva`.
- [ ] 1.2 Crear `src/api/auth.ts` con funciones tipadas `loginApi`, `abrirSesionLinea`, `actualizarActividad`, `getSesionActiva`, `cerrarSesionLinea`.
- [ ] 1.3 Modificar `src/api/axios.ts` para simplificar interceptor 401 y agregar `setLogoutHandler` setter.

## Phase 2: Core Implementation

- [x] 2.1 Modificar `src/features/auth/context/AuthContext.tsx` para agregar `activeLineaId` y decodificar JWT body en login.
- [x] 2.2 Integrar `setLogoutHandler` en `AuthContext.tsx` al montar para evitar ciclos circulares.
- [x] 2.3 Crear hook `src/features/tablet/hooks/useActividadHeartbeat.ts` llamando a `actualizarActividad` cada 2 min.

### Phase 3: Componentes de UI de Sesión

- [x] 3.1 Modificar `src/pages/Login.tsx` para usar `loginApi` y remover decodificación manual de JWT.
- [x] 3.2 Modificar `src/features/tablet/pages/ActivarSesionPage.tsx` para usar `abrirSesionLinea` y manejar error 409.
- [x] 3.3 Modificar `src/features/tablet/pages/TabletWorkspace.tsx` para leer `activeLineaId` de `AuthContext` e inicializar heartbeat.

### Phase 4: Actualización de Tests Existentes

- [x] 4.1 Modificar `AuthContext.test.tsx` para reflejar que JWT ya viene en formato de objeto.
- [x] 4.2 Modificar `Login.test.tsx` con mocks de `loginApi`.
- [x] 4.3 Modificar/agregar tests en `src/features/tablet/pages/ActivarSesionPage.test.tsx` cubriendo el error 409. (RED -> GREEN).
