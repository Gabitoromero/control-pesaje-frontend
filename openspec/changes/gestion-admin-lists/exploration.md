## Exploration: gestion-admin-lists

### Current State
- The application currently has a flat navigation menu in `DashboardLayout.tsx`.
- The `Planta` menu option currently renders a placeholder (`Vista de Planta — en construcción`).
- The frontend `api` folder contains only `usuarios.ts` and `articulos.ts`. It lacks endpoints for `etapas`, `lineas`, and `rutas`.
- The existing pages (`UsuariosPage.tsx` and `ArticulosPage.tsx`) follow a solid pattern (React Query, HTML table, edit modal) but their TypeScript models do not fully map to the backend (e.g., frontend `Usuario` lacks `legajo`; frontend `Articulo` lacks `marca`).

### Affected Areas
- `frontend/src/layouts/DashboardLayout.tsx` — Needs sidebar reorganization into sections (Monitoreo, Planta, Gestión, Reportes). `Planta` link will point to `/tablet/seleccion-linea`.
- `frontend/src/App.tsx` — Route declarations for the 3 new list pages under the dashboard layout.
- `frontend/src/api/` — Needs `etapas.ts`, `lineas.ts`, `rutas.ts` added. Existing `usuarios.ts` and `articulos.ts` need their interfaces updated to match backend models.
- `frontend/src/features/dashboard/pages/` — Needs `EtapasPage.tsx`, `LineasPage.tsx`, `RutasPage.tsx` created. Existing `UsuariosPage.tsx` and `ArticulosPage.tsx` need their table columns updated.

### Approaches
1. **Standard Flat Implementation (Recommended)** — Duplicate the `UsuariosPage.tsx` pattern for the 3 new entities. Update `DashboardLayout.tsx` to group links visually and route `Planta` to the Layer 2 session.
   - Pros: Follows existing robust patterns perfectly, keeps component logic decoupled (e.g., users have PIN logic that stages don't), low risk.
   - Cons: Repetitive code for CRUD operations.
   - Effort: Medium

2. **Generic CRUD Component** — Refactor `UsuariosPage.tsx` into a reusable `<GenericCrudTable />` that takes columns, data, and mutations, then use it for all 5 lists.
   - Pros: Reduces boilerplate code significantly across the 5 pages.
   - Cons: Overcomplicates the UI when specific entities need custom behavior (like `Usuarios` needing PIN vs Password logic based on role).
   - Effort: High

### Recommendation
**Approach 1 (Standard Flat Implementation)**. The custom behavior required for entities like `Usuarios` makes a generic CRUD too complex for this stage. Duplicating the page pattern for `Etapas`, `Rutas`, and `Lineas` is safest, fastest, and aligns with the current architecture.

### Risks
- **Data Mapping**: The `LineaProduccion` model relates to `RutaPasada`. Depending on how the backend serializes the response, the table will need to safely render the related route's name.
- **Backend Types Validation**: Need to ensure the backend actually returns `legajo` and `marca` in the GET requests, although they exist in the MikroORM models.

### Ready for Proposal
Yes — The UI patterns to copy are verified, the backend models support the requested data, and we can proceed to propose/apply the changes.
