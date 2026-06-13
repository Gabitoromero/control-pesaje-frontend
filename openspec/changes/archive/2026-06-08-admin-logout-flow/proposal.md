# Proposal: admin-logout-flow

## Intent

Implement a role-based frontend routing flow for the logout process (`cerrar-sesion` from Layer 2 / Linea), allowing operators to completely log out while administrators and chiefs are redirected back to the dashboard without losing their system session.

## Scope

### In Scope
- Create a `deactivateLayer2Session(lineaId?)` function in `AuthContext` (or a dedicated hook).
- Integrate `POST /auth/cerrar-sesion` within the new function to clear the production line assignment.
- Implement conditional routing: complete logout (clear token + `/login` redirect) for `operario` role, and partial logout (`/dashboard` redirect) for `administrador` or `jefe` roles.
- Add a "Salir" button in `TabletWorkspace.tsx` utilizing the new function.
- Update the existing "Salir" button in `SeleccionLineaPage.tsx` to use the new function.

### Out of Scope
- Backend modifications (assuming `POST /auth/cerrar-sesion` already works as expected).
- Changing the authentication token mechanism or backend role assignments.
- Adding new roles to the system.

## Capabilities

> This section is the CONTRACT between proposal and specs phases.
> The sdd-spec agent reads this to know exactly which spec files to create or update.

### New Capabilities
- `session-management`: Handles authentication state, Layer 2 (Line) session assignment, and role-based conditional routing during logout.

### Modified Capabilities
- None

## Approach

We will centralize the Layer 2 session deactivation logic in the frontend. We will introduce `deactivateLayer2Session` which first calls the backend to unassign the production line. Upon success, it inspects the user's role: operators get a full logout (token cleared, redirected to `/login`), while admins/chiefs keep their token and are redirected to `/dashboard`. This logic will be wired to the "Salir" buttons in `TabletWorkspace.tsx` and `SeleccionLineaPage.tsx`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `AuthContext` / new hook | Modified/New | Add `deactivateLayer2Session` logic |
| `src/pages/TabletWorkspace.tsx` | Modified | Add "Salir" button |
| `src/pages/SeleccionLineaPage.tsx` | Modified | Update existing "Salir" button |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| User role is undefined or not properly checked | Low | Ensure the hook handles cases where `user` or `user.rol` is missing gracefully (defaulting to safe full logout). |
| Backend `/auth/cerrar-sesion` fails | Low | Add error handling to alert the user and potentially force a full logout if state becomes inconsistent. |

## Rollback Plan

Revert the changes to `TabletWorkspace.tsx` and `SeleccionLineaPage.tsx` to use the old logout function, and remove the role-check logic from `AuthContext`.

## Dependencies

- Existing `POST /auth/cerrar-sesion` endpoint must be functional.

## Success Criteria

- [ ] Operator clicking "Salir" is redirected to `/login` and token is cleared.
- [ ] Admin/Chief clicking "Salir" is redirected to `/dashboard` and token remains active.
- [ ] Backend endpoint `/auth/cerrar-sesion` is called in both cases.
- [ ] "Salir" button is present and functional in both `TabletWorkspace.tsx` and `SeleccionLineaPage.tsx`.
