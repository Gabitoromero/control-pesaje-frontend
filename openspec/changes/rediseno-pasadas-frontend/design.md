# Design: Rediseño Pasadas Frontend

## Technical Approach

Introduce `GestionPasadasPage` as a middle layer between line selection and the active scale workspace. `SeleccionLineaPage` will push users to `/tablet/pasadas` upon activating a line. The exit action in `TabletWorkspace` will simply navigate back to `/tablet/pasadas` rather than terminating the session. The responsibility of dropping the line session (`closeLineSession()`) is moved to `GestionPasadasPage`. Additionally, the logout action in `SeleccionLineaPage` will route `Jefe/Administrador` back to the dashboard instead of performing a hard logout.

## Architecture Decisions

### Decision: Placement of line session termination (`closeLineSession`)
**Choice**: Moved to `GestionPasadasPage`.
**Alternatives considered**: Leaving it in `TabletWorkspace` or creating an explicit "Liberar Línea" modal.
**Rationale**: The user needs to exit the workspace to view other pasadas on the same line without losing the line lock. The line should only be released when the user explicitly leaves the "Pasadas" scope.

### Decision: Role-based exit routing in `SeleccionLineaPage`
**Choice**: Direct evaluation of `user.rol` in the `Salir` button `onClick` handler.
**Alternatives considered**: Adding a new specific logout function inside `AuthContext`.
**Rationale**: Keeps the change localized to the UI layer, fully matching the requested proposal scope.

## Data Flow

    SeleccionLineaPage ──(abrirSesionLinea)──→ GestionPasadasPage ──(select/create pasada)──→ TabletWorkspace
         │                                          │     ↑                                        │
     (logout/dashboard)                    (closeLineSession)                                 (Volver)
                                                    └──────────────────────────────────────────────┘

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/App.tsx` | Modify | Add route `<Route path="/tablet/pasadas" element={<GestionPasadasPage />} />`. |
| `frontend/src/features/tablet/pages/SeleccionLineaPage.tsx` | Modify | Update line selection to navigate to `/tablet/pasadas`. Update `Salir` button logic based on user role (`/dashboard` vs `logout()`). |
| `frontend/src/features/tablet/pages/TabletWorkspace.tsx` | Modify | Change 'Salir' button to 'Volver', remove `closeLineSession()`, and route back to `/tablet/pasadas`. |
| `frontend/src/features/tablet/pages/GestionPasadasPage.tsx` | Create | New intermediary screen listing pasadas. Includes a back button to trigger `closeLineSession()` and return to line selection, and a forward action to enter `TabletWorkspace`. |

## Interfaces / Contracts

Since backend modifications are out of scope, the initial `GestionPasadasPage` will use mock arrays to display "pasadas" and navigate to the `TabletWorkspace`. 

```typescript
// No new domain interfaces required; existing types reused.
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Navigation logic in `SeleccionLineaPage` | Mock `user.rol` and `useNavigate` to verify correct dashboard vs logout routing. |
| Integration | Workspace back button | Render `TabletWorkspace`, click "Volver", verify it routes to `/tablet/pasadas` and does NOT call `closeLineSession()`. |
| E2E | Line Lock persistence | Verify that leaving the `TabletWorkspace` to the pasadas screen leaves the session active on the backend. |

## Migration / Rollout

No migration required.

## Open Questions

- [ ] Does `GestionPasadasPage` require any explicit parameters passed in React Router state from `TabletWorkspace` (like the last completed pasada ID), or is standard context enough?
