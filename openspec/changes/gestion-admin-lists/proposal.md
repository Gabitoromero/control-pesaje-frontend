# Proposal: Gestion Admin Lists

## Intent

Group dashboard navigation conceptually, provide full CRUD management pages for administrative entities (Articulos, Etapas, Lineas, Rutas), and update existing lists (Usuarios, Articulos) to align with backend models, all using established robust patterns.

## Scope

### In Scope
- Update `DashboardLayout` sidebar with sections (Monitoreo, Planta, Gestión, Reportes).
- Route `Planta` to `/tablet/seleccion-linea`.
- Create list pages for `Etapas`, `Lineas`, and `Rutas`.
- Update `Usuarios` and `Articulos` frontend models and table columns.
- Add API functions (`etapas.ts`, `lineas.ts`, `rutas.ts`).
- Secure the `Gestión` options with role guards (Admin only).

### Out of Scope
- Generic CRUD component abstraction.
- Implementing the `Planta` view (only routing to existing flow).
- Backend API modifications.

## Capabilities

### New Capabilities
- `admin-layout`: New layout sidebar groupings and role guards.
- `admin-management`: New lists (Articulos, Etapas, Lineas, Rutas) and update to Usuarios list.

### Modified Capabilities
- None

## Approach

Duplicate the standard React Query + HTML table + modal pattern from `UsuariosPage.tsx` for the new list pages. Update `DashboardLayout.tsx` to group links visually and add role guards for Gestión links. Update existing API interfaces, adhering to React 19 rules (no memoization, proper `use client` directives) and strict TypeScript patterns.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/layouts/DashboardLayout.tsx` | Modified | Reorganize sidebar and add role guards |
| `frontend/src/App.tsx` | Modified | Add routes for new pages |
| `frontend/src/api/` | New/Modified | Add `etapas`, `lineas`, `rutas` endpoints. Update `usuarios`, `articulos` |
| `frontend/src/features/dashboard/pages/` | New/Modified | Create 3 new list pages, update columns in existing pages |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Data Mapping (Nested relations serialization) | Med | Handle potentially null or nested relations safely in UI tables |
| Backend Types mismatch | Low | Validate actual API responses against expected TS models; fallback gracefully |

## Rollback Plan

Revert the commit adding the new routes and API files. Restore `DashboardLayout.tsx` to its original flat structure.

## Dependencies

- Backend must support GET endpoints for `etapas`, `lineas`, `rutas` returning all required fields.

## Success Criteria

- [ ] Sidebar is grouped and correctly guards `Gestión` links for Admins.
- [ ] List pages for `Articulos`, `Etapas`, `Lineas`, and `Rutas` load data via React Query.
- [ ] Models for `Usuarios` and `Articulos` correctly include `legajo` and `marca` respectively.
- [ ] Standard styling rules (Tailwind 4) and TypeScript const patterns are applied without memoization.
