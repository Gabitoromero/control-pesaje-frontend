# Apply Progress: admin-logout-flow

## Completed Tasks
- [x] 1.1 Update `frontend/src/features/auth/context/AuthContext.tsx` to add `deactivateLayer2Session(lineaId?: number)`.
- [x] 1.2 Update `frontend/src/features/tablet/pages/TabletWorkspace.tsx` to add a "Salir" button in the header.
- [x] 1.3 Update `frontend/src/features/tablet/pages/SeleccionLineaPage.tsx` to change the existing "Salir" button.
- [x] 2.1 Update or create tests for `AuthContext`.
- [x] 2.2 Update or create component tests for `TabletWorkspace` and `SeleccionLineaPage`.

## Files Changed
| File | Action | What Was Done |
|------|--------|---------------|
| `frontend/src/features/auth/context/AuthContext.tsx` | Modified | Added `deactivateLayer2Session` logic |
| `frontend/src/features/tablet/pages/TabletWorkspace.tsx` | Modified | Added "Salir" button that calls `deactivateLayer2Session` |
| `frontend/src/features/tablet/pages/SeleccionLineaPage.tsx` | Modified | Swapped `logout` for `deactivateLayer2Session` |
| `frontend/src/test/render.tsx` | Modified | Updated mock authProvider with `deactivateLayer2Session` |
| `frontend/src/features/auth/context/AuthContext.test.tsx` | Created | Added tests for role-based logout routing |
| `frontend/src/features/tablet/pages/SeleccionLineaPage.test.tsx` | Modified | Added test for Salir button |
| `frontend/src/features/tablet/pages/TabletWorkspace.test.tsx` | Created | Added test for Salir button |

## Deviations from Design
None — implementation matches design.

## Issues Found
Vitest's default jsdom environment had issues with `localStorage.clear()`. Mocked `window.localStorage` completely in `AuthContext.test.tsx` to ensure tests execute cleanly.

## Remaining Tasks
None.

## Status
All tasks complete. Ready for verify.
