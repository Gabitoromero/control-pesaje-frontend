# Proposal: Rediseño Pasadas Frontend

## Intent

Improve the navigation and operational flow of the application by introducing a dedicated "Gestión de Pasadas" screen. This screen will act as an intermediary step between selecting a line (`SeleccionLineaPage`) and the scale reading workspace (`TabletWorkspace`), solving the current issue where users are either logged out globally or drop the line session abruptly when trying to exit the workspace.

## Scope

### In Scope
- Create a new route and screen for "Gestión de Pasadas" (`/tablet/pasadas`).
- Modify `SeleccionLineaPage` to navigate to `/tablet/pasadas` instead of directly to `/tablet`.
- Update the `Salir` button logic in `SeleccionLineaPage` to redirect `Jefe`/`Administrador` to `/dashboard` and globally logout `Operario`.
- Update the `Salir` button in `TabletWorkspace` to act as a `Volver` button, navigating back to `/tablet/pasadas` without automatically closing the line session.

### Out of Scope
- Backend modifications or new API endpoints for managing "pasadas".
- Restyling or functional changes inside `TabletWorkspace` unrelated to the `Salir` button.

## Capabilities

### New Capabilities
- `gestion-pasadas`: Intermediate routing and listing screen for active "pasadas" before entering the scale reading workspace.

### Modified Capabilities
- `seleccion-linea`: Navigation and exit flow logic updated to incorporate the new "pasadas" step.
- `tablet-workspace`: Exit flow logic changed from closing session to returning to the previous "pasadas" screen.

## Approach

Implement a new dedicated route `/tablet/pasadas` mapped to a new `GestionPasadasPage.tsx` component. This component will sit between the line selection and the tablet workspace. Update the navigation hooks/functions in `SeleccionLineaPage` to push `/tablet/pasadas` upon line selection. In `TabletWorkspace`, adjust the exit action to simply route back to `/tablet/pasadas` instead of emitting a session-drop or logging out.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/App.tsx` | Modified | Add new route `/tablet/pasadas` for `GestionPasadasPage` |
| `frontend/src/features/tablet/pages/SeleccionLineaPage.tsx` | Modified | Change navigation to `/tablet/pasadas` and update `Salir` logout/redirect rules |
| `frontend/src/features/tablet/pages/TabletWorkspace.tsx` | Modified | Change `Salir` to `Volver` with routing to `/tablet/pasadas` |
| `frontend/src/features/tablet/pages/GestionPasadasPage.tsx` | New | Create the new intermediary screen for pasadas |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| User session state becomes inconsistent when navigating back and forth between line selection and pasadas | Medium | Ensure React Router guards and local context properly re-validate line selection state on the new page |
| Unintended session termination for Operarios | Low | Add unit/integration tests to verify role-based navigation logic on the `Salir` button |

## Rollback Plan

Revert the routing changes in `frontend/src/App.tsx`, restore the previous navigation paths in `SeleccionLineaPage.tsx` and `TabletWorkspace.tsx`, and delete `GestionPasadasPage.tsx`.

## Dependencies

- Existing frontend routing infrastructure (React Router).
- Existing user authentication and role-based context.

## Success Criteria

- [ ] Selecting a line in `SeleccionLineaPage` successfully navigates to `/tablet/pasadas`.
- [ ] `Salir` from `SeleccionLineaPage` redirects `Jefe/Administrador` to `/dashboard` and logs out `Operario`.
- [ ] `Salir` (now `Volver`) from `TabletWorkspace` navigates to `/tablet/pasadas` without destroying the active line session.
