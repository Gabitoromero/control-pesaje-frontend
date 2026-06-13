# Tasks: admin-logout-flow

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~100 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Not needed |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Complete admin logout flow | PR 1 | Main branch; includes tests |

## Phase 1: Core Implementation

- [x] 1.1 Update `frontend/src/features/auth/context/AuthContext.tsx` to add `deactivateLayer2Session(lineaId?: number)` to the `AuthContextType` interface and its implementation, calling `POST /auth/cerrar-sesion` and redirecting (`/login` for `operario`, `/dashboard` otherwise).
- [x] 1.2 Update `frontend/src/features/tablet/pages/TabletWorkspace.tsx` to add a "Salir" button in the header that invokes `deactivateLayer2Session(lineaId)`.
- [x] 1.3 Update `frontend/src/features/tablet/pages/SeleccionLineaPage.tsx` to change the existing "Salir" button to invoke `deactivateLayer2Session()` instead of `logout()`.

## Phase 2: Testing

- [x] 2.1 Update or create tests for `AuthContext` to verify `deactivateLayer2Session` logic (backend call and role-based redirect).
- [x] 2.2 Update or create component tests for `TabletWorkspace` and `SeleccionLineaPage` to verify the "Salir" button triggers the correct function.
