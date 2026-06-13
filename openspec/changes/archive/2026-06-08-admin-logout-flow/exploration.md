## Exploration: Differentiate logout behavior (Global logout vs Layer 2 deactivation)

### Current State
- The backend uses stateless JWT for Capa 1 (Global login). There is no "full logout" endpoint; Capa 1 logout is entirely handled by the frontend clearing cookies.
- There is a backend endpoint `/auth/cerrar-sesion` that deactivates the Capa 2 (Layer 2) session in memory (`sesionService`).
- The frontend `AuthContext` has a `logout()` function that clears the Capa 1 JWT from cookies and local storage, then redirects to `/login`.
- Currently, the frontend `logout()` does **not** call the backend `/auth/cerrar-sesion`, meaning the Capa 2 session incorrectly remains active in the backend memory when a user logs out globally.
- There is no UI in `TabletWorkspace.tsx` to exit the Capa 2 session. The `SeleccionLineaPage` has a `Salir` button that triggers a full `logout()`.

### Affected Areas
- `backend/src/controllers/auth.controller.ts` — `cerrarSesion` is functioning but is never called by the frontend.
- `frontend/src/features/auth/context/AuthContext.tsx` — Needs a new function for "deactivating Capa 2" that behaves conditionally based on the user role.
- `frontend/src/features/tablet/pages/TabletWorkspace.tsx` — Needs a "Salir" or "Cerrar sesión de línea" button.
- `frontend/src/features/tablet/pages/SeleccionLineaPage.tsx` — The "Salir" button should probably use the new layered logout logic.

### Approaches
1. **Frontend-driven conditional routing (Recommended)**
   - Create a `deactivateLayer2Session(lineaId?: number)` function in `AuthContext` (or a separate hook).
   - The function calls `POST /auth/cerrar-sesion` with the `lineaProduccionId` if applicable.
   - If `user.rol === 'operario'`, it then calls `logout()` (clears token, redirects to `/login`).
   - If `user.rol === 'administrador'` or `'jefe'`, it does not clear the token and navigates to `/dashboard`.
   - Add a "Salir" button in `TabletWorkspace` that calls this new function.
   - Pros: Simple, leverages existing stateless Capa 1 auth, zero backend changes needed (since `cerrar-sesion` already handles Capa 2 state).
   - Cons: Requires modifying multiple frontend components.
   - Effort: Low

2. **Backend-driven redirection state**
   - Modify `/auth/cerrar-sesion` to return a specific action payload (e.g., `{ action: 'FULL_LOGOUT' }` or `{ action: 'REDIRECT_DASHBOARD' }`).
   - The frontend reads this response and executes the corresponding UI transition.
   - Pros: Single source of truth for role-based navigation logic.
   - Cons: Mixes routing logic into the backend API; unnecessary complexity.
   - Effort: Medium

### Recommendation
**Approach 1 (Frontend-driven conditional routing)** is the best fit. The backend already has the correct endpoints (`/auth/cerrar-sesion` for Capa 2 only). The missing link is that the frontend needs to invoke this endpoint, check the locally available `user.rol`, and perform the correct redirection/cleanup.

### Risks
- Active Capa 2 sessions for operators might not be cleaned up if they close the tab instead of clicking "Salir" (already a risk, but highlighting it).
- We must ensure we pass the correct `lineaProduccionId` to `/auth/cerrar-sesion` when the operator leaves the `TabletWorkspace`.

### Ready for Proposal
Yes. The orchestrator can proceed with proposing Approach 1.
