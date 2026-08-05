# Proposal: articulo-rename-fix

## Intent

Propagate the backend field rename of the `Articulo` entity (`nombre` to `codigo`, and `marca` to `nombre`) into the frontend to resolve TypeScript compile errors and restore correct UI data mapping.

## Scope

### In Scope
- Update `Articulo` and `ArticuloRutaPasadaItem` interfaces.
- Rename fields in `ArticulosPage` table/form (Nombre -> Código, Marca -> Nombre).
- Re-map article fields in `RutaFormPage`, `PasadasActivasPage`, `PasadaCard`, `TabletWorkspace`, mock handlers, and tests.
- Re-link the broken `src/shared` symlink to `../codigo/backend/src/shared`.

### Out of Scope
- Backend modifications.
- Modifications to other entities or schemas (e.g. users, stages).

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `articulo-rename-fix`: Align frontend models, forms, and tables with updated backend entity properties.

## Approach

1. Re-point `src/shared` symlink to `../codigo/backend/src/shared`.
2. Rename interface properties in `src/api/articulos.ts` and `src/api/articulos-ruta.ts`.
3. Update fields, forms, search criteria, and table views in `ArticulosPage`, `RutaFormPage`, `PasadasActivasPage`, `PasadaCard`, and `TabletWorkspace`.
4. Adjust MSW mocks in `src/test/handlers.ts` and update related unit/integration tests to match the new schema.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/shared` | Modified | Symlink to backend types |
| `src/api/articulos.ts` | Modified | Update `Articulo` schema definition and API calls |
| `src/api/articulos-ruta.ts` | Modified | Update `ArticuloRutaPasadaItem` definition |
| `src/api/rutas-pasadas-articulos.ts` | Modified | Map renamed fields |
| `src/features/dashboard/pages/ArticulosPage.tsx` | Modified | Rename fields in table, search toolbar, sorting, and form modal |
| `src/features/dashboard/pages/RutaFormPage.tsx` | Modified | Adapt selection combo box and list display |
| `src/features/dashboard/pages/PasadasActivasPage.tsx` | Modified | Display code and brand fields correctly |
| `src/features/tablet/components/PasadaCard.tsx` | Modified | Update composite name generator helper |
| `src/features/tablet/pages/TabletWorkspace.tsx` | Modified | Render name correctly in topbar |
| `src/test/handlers.ts` | Modified | Update MSW mock data definitions |
| `src/features/dashboard/pages/ArticulosPage.test.tsx` | Modified | Assert "Código" column presence and update mock selectors |
| `src/features/dashboard/pages/RutaFormPage.test.tsx` | Modified | Align mock options assertions |
| `src/features/tablet/components/PasadaCard.test.tsx` | Modified | Align mock data assertions |
| `src/api/rutas-pasadas-articulos.test.ts` | Modified | Align mock data assertions |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Test suite breakage | High | Update MSW mock handlers and test assertions in lockstep |
| Incorrect symlink path | Med | Verify relative path resolves properly to the backend directory |

## Rollback Plan

- Revert Git commit of changes.
- Re-create symlink to `../../backend/src/shared`.

## Dependencies

- Backend change completed.

## Success Criteria

- [ ] Frontend compiles without TypeScript errors.
- [ ] Table columns display "Código" and "Nombre" with correct database mapping.
- [ ] All unit, integration, and UI tests pass successfully.
