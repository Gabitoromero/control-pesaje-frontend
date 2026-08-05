# Tasks: Articulo Rename Fix

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 120-160 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Complete field rename propagation | PR 1 | `npm run test` | N/A (low line count) | Revert the single commit/PR |

## Phase 1: Symlink & Models

- [x] 1.1 Re-create symlink `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/shared` pointing to `../../codigo/backend/src/shared`
- [x] 1.2 Update `Articulo` interface in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/api/articulos.ts` to map `codigo` (string) and `nombre` (string)
- [x] 1.3 Update `ArticuloRutaPasadaItem` nested fields in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/api/articulos-ruta.ts`

## Phase 2: UI Pages

- [x] 2.1 Refactor table columns, search fields, and modal form inputs in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/features/dashboard/pages/ArticulosPage.tsx`
- [x] 2.2 Update combo box options and assigned list formatting in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/features/dashboard/pages/RutaFormPage.tsx`
- [x] 2.3 Update article table cell rendering to display code and name in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/features/dashboard/pages/PasadasActivasPage.tsx`
- [x] 2.4 Refactor `getArticuloNombre` helper to format brand-code in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/features/tablet/components/PasadaCard.tsx`
- [x] 2.5 Render composite `Brand - Code` name in topbar of `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/features/tablet/pages/TabletWorkspace.tsx`

## Phase 3: Tests & Mock Handlers

- [x] 3.1 Update `articulosMock` and MSW handlers in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/test/handlers.ts` to match the new schema
- [x] 3.2 Update column assertions, input selectors, and payloads in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/features/dashboard/pages/ArticulosPage.test.tsx`
- [x] 3.3 Update combobox selection options text assertions in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/features/dashboard/pages/RutaFormPage.test.tsx`
- [x] 3.4 Adjust mock article fields and assertions in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/features/tablet/components/PasadaCard.test.tsx`
- [x] 3.5 Align payload schema and assertions in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/api/rutas-pasadas-articulos.test.ts`
