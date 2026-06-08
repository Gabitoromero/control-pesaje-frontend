# Tasks: Gestion Admin Lists

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350-450 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (API & Layout) → PR 2 (Pages) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | APIs and Layout/Routing updates | PR 1 | Base branch; safe foundation |
| 2 | CRUD List Pages implementation | PR 2 | Depends on PR 1; contains all UI lists |

## Phase 1: Foundation (API & Routing)

- [x] 1.1 Modify `frontend/src/api/usuarios.ts`: Add `legajo` string field to `Usuario` interface.
- [x] 1.2 Modify `frontend/src/api/articulos.ts`: Add `marca` string field to `Articulo` interface.
- [x] 1.3 Create `frontend/src/api/etapas.ts`: Define `Etapa` interfaces and export CRUD functions (GET, POST, PUT, DELETE) using standard axios calls.
- [x] 1.4 Create `frontend/src/api/lineas.ts`: Define `Linea` interfaces (with optional `etapa` relation) and export CRUD functions.
- [x] 1.5 Create `frontend/src/api/rutas.ts`: Define `Ruta` interfaces and export CRUD functions.

## Phase 2: Layout & Core Routing

- [x] 2.1 Modify `frontend/src/layouts/DashboardLayout.tsx`: Reorganize sidebar links into sections (Monitoreo, Planta, Gestión, Reportes). Wrap the Gestión section with an inline `user?.rol === UsuarioRol.ADMIN` check.
- [x] 2.2 Modify `frontend/src/App.tsx`: Add routes for `/dashboard/etapas`, `/dashboard/lineas`, `/dashboard/rutas`. Update `/dashboard/planta` to `<Navigate to="/tablet/seleccion-linea" />`.

## Phase 3: Core Implementation (List Pages)

- [x] 3.1 Modify `frontend/src/features/dashboard/pages/UsuariosPage.tsx`: Add `legajo` to table columns and include it as a required field in the modal form.
- [x] 3.2 Modify `frontend/src/features/dashboard/pages/ArticulosPage.tsx`: Add `marca` to table columns and include it as a required field in the modal form.
- [x] 3.3 Create `frontend/src/features/dashboard/pages/EtapasPage.tsx`: Implement table and modal using `useQuery`/`useMutation`. Form requires only mandatory fields.
- [x] 3.4 Create `frontend/src/features/dashboard/pages/LineasPage.tsx`: Implement table (display `linea.etapa?.nombre ?? '-'`) and modal using `useQuery`/`useMutation`. Form requires only mandatory fields.
- [x] 3.5 Create `frontend/src/features/dashboard/pages/RutasPage.tsx`: Implement table and modal using `useQuery`/`useMutation`. Form requires only mandatory fields.
