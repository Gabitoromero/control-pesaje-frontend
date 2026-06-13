# Tasks: rediseno-pasadas-frontend

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

| Field | Value |
|-------|-------|
| Estimated changed lines | ~200-250 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Not needed |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

### Suggested Work Units

Not needed.

## Phase 1: Foundation
- [x] 1.1 Create `frontend/src/features/tablet/pages/GestionPasadasPage.tsx` with a basic UI shell.
- [x] 1.2 Update `frontend/src/App.tsx` to add the route `/tablet/pasadas` pointing to `GestionPasadasPage`.

## Phase 2: Line Selection Update
- [x] 2.1 Update `frontend/src/features/tablet/pages/SeleccionLineaPage.tsx`: change line selection success handler to navigate to `/tablet/pasadas`.
- [x] 2.2 Update `frontend/src/features/tablet/pages/SeleccionLineaPage.tsx`: modify "Salir" button to check `user?.rol`. If `Jefe` or `Administrador`, navigate to `/dashboard`. Otherwise, call `logout()`.
- [x] 2.3 Update `frontend/src/features/tablet/pages/SeleccionLineaPage.test.tsx` to verify the new navigation and role-based logout behavior.

## Phase 3: Workspace Update
- [x] 3.1 Update `frontend/src/features/tablet/pages/TabletWorkspace.tsx`: Change the "Salir" button text to "Volver".
- [x] 3.2 Update `frontend/src/features/tablet/pages/TabletWorkspace.tsx`: Remove `closeLineSession()` call from the back/volver action and instead navigate to `/tablet/pasadas`.
- [x] 3.3 Update `frontend/src/features/tablet/pages/TabletWorkspace.test.tsx` to verify the new "Volver" behavior without destroying the session.

## Phase 4: Gestión de Pasadas Implementation
- [x] 4.1 Update `frontend/src/features/tablet/pages/GestionPasadasPage.tsx`: Add back button that calls `closeLineSession()` and navigates to the line selection page (e.g., `/tablet`).
- [x] 4.2 Update `frontend/src/features/tablet/pages/GestionPasadasPage.tsx`: Display a mock list of pasadas.
- [x] 4.3 Update `frontend/src/features/tablet/pages/GestionPasadasPage.tsx`: Add action to a mock pasada to navigate to the `TabletWorkspace` (e.g., `/tablet/linea/{lineaActivaId}`).
- [x] 4.4 Create `frontend/src/features/tablet/pages/GestionPasadasPage.test.tsx` to verify back button (`closeLineSession`) and forward navigation to workspace.
