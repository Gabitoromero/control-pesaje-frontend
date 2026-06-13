# Design: admin-logout-flow

## Technical Approach

We will enhance the `AuthContext` by introducing a `deactivateLayer2Session(lineaId?: number)` function. This function will be responsible for orchestrating the frontend portion of the Layer 2 (Line) logout process. It will first invoke the backend endpoint (`POST /auth/cerrar-sesion`) to ensure the line assignment is cleared. Then, it will inspect the user's role: operators will trigger a full system logout (clearing tokens and redirecting to `/login`), while administrators or chiefs will bypass the full logout and instead be redirected back to the `/dashboard`. The "Salir" buttons in the tablet views will be wired to this new function.

## Architecture Decisions

### Decision: Centralize logout logic in AuthContext

**Choice**: Add `deactivateLayer2Session` to `AuthContext`.
**Alternatives considered**: Create a separate custom hook `useLayer2Logout` or handle logic directly in the UI components.
**Rationale**: The role-based routing directly interacts with authentication state and `logout` logic already residing in `AuthContext`. Centralizing it here keeps the UI components dumb and avoids duplicating the role inspection logic across multiple views.

### Decision: Redirect mechanism

**Choice**: Use `window.location.href` for redirection.
**Alternatives considered**: Provide a callback to `useNavigate` from `react-router-dom` or use a global router history object.
**Rationale**: `AuthContext` currently uses `window.location.href = '/login'` for full logouts because it sits outside the standard router context hierarchy where `useNavigate` is easily injected without additional boilerplate. Continuing this pattern for `/dashboard` ensures consistency and avoids refactoring the entire context provider tree.

## Data Flow

    Component (TabletWorkspace / SeleccionLineaPage)
         │
         │ calls `deactivateLayer2Session(lineaId?)`
         ▼
    AuthContext
         │
         ├── 1. `POST /auth/cerrar-sesion` ──→ Backend (Clear assignment)
         │
         └── 2. Inspect `user.rol`
                  ├── 'operario' ──────→ calls `logout()` (Clears token, `window.location = '/login'`)
                  └── 'administrador' / 'jefe' ──→ keeps token, `window.location = '/dashboard'`

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/features/auth/context/AuthContext.tsx` | Modify | Add `deactivateLayer2Session` function. Update `AuthContextType` interface. |
| `frontend/src/features/tablet/pages/TabletWorkspace.tsx` | Modify | Add a "Salir" button in the header calling `deactivateLayer2Session(lineaId)`. |
| `frontend/src/features/tablet/pages/SeleccionLineaPage.tsx` | Modify | Update the existing "Salir" button to call `deactivateLayer2Session()` instead of `logout()`. |

## Interfaces / Contracts

**AuthContextType addition:**

```tsx
export interface AuthContextType {
  // ... existing fields ...
  deactivateLayer2Session: (lineaId?: number) => Promise<void>;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `AuthContext` logout logic | Verify that `deactivateLayer2Session` calls the backend endpoint and redirects properly based on mocked user roles. |
| Integration | Tablet Pages | Verify that clicking "Salir" on `TabletWorkspace` and `SeleccionLineaPage` triggers `deactivateLayer2Session` instead of simple logout. |
| E2E | Role-based logout flow | E2E test with an operator user verifying `/login` redirect, and another test with an admin user verifying `/dashboard` redirect. |

## Migration / Rollout

No migration required. The change is purely frontend routing and logic, depending on an already existing backend endpoint.

## Open Questions

- None
