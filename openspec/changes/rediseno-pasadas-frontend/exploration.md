## Exploration: rediseno-pasadas-frontend

### Current State
Currently, `SeleccionLineaPage` handles selecting a production line and directly navigating to `TabletWorkspace` where the scale reading occurs (`/tablet`). The exit flow globally logs out the user on `SeleccionLineaPage` and drops the line session directly from `TabletWorkspace` to return to line selection. 

### Affected Areas
- `frontend/src/App.tsx` — Requires a new route for the "Gestión de Pasadas" screen (e.g. `/tablet/pasadas`).
- `frontend/src/features/tablet/pages/SeleccionLineaPage.tsx` — 
  - Change line selection navigation to redirect to the new "Gestión de Pasadas" screen (`/tablet/pasadas`) instead of `/tablet`.
  - Update `Salir` button logic to redirect `Jefe`/`Administrador` to `/dashboard` and globally logout `Operario`.
- `frontend/src/features/tablet/pages/TabletWorkspace.tsx` — 
  - Change `Salir` button to `Volver` with navigation returning to `/tablet/pasadas` rather than closing the line session.
- `frontend/src/features/tablet/pages/GestionPasadasPage.tsx` (New File) —
  - To be introduced as the intermediate screen listing active pasadas, creating new ones, or selecting existing ones to continue.

### Approaches
1. **New Dedicated Route `/tablet/pasadas`** — Create `GestionPasadasPage.tsx` as a distinct page route between `SeleccionLineaPage` and `TabletWorkspace`. 
   - Pros: Clear separation of concerns, clean URL structure, easy handling of the back button (`Volver`), standard React Router flow.
   - Cons: Slight overhead adding another route to `App.tsx`.
   - Effort: Low

2. **Modal / Overlay on `SeleccionLineaPage`** — Show the active pasadas in a modal immediately after selecting the line on `SeleccionLineaPage`.
   - Pros: Fewer routes and pages.
   - Cons: Mixes line selection state with pasadas state. Can make `SeleccionLineaPage` complex and breaks the natural back-forward navigation on tablet devices.
   - Effort: Medium

### Recommendation
**New Dedicated Route `/tablet/pasadas`** (Approach 1) is recommended. It naturally aligns with the routing flow and allows the required intermediate ABM screen to have its own lifecycle, managing pasadas for the active line before jumping into the scale workspace. This also makes the 'Volver' functionality in `TabletWorkspace` very simple (just navigate back to `/tablet/pasadas`).

### Risks
- Handling of `activeLineaId`: Ensure that if a user directly navigates to `/tablet/pasadas` without an active line, they are redirected back to `/tablet/seleccion-linea`.
- The creation of new pasadas might require the definition of new API endpoints or mock state if backend endpoints for "create/list active pasadas by line and user" are not yet available.

### Ready for Proposal
Yes — The orchestrator can proceed to `sdd-propose`. The codebase structure readily supports introducing this new page route and modifying the button handlers.
