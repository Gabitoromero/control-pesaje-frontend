# Apply Progress: articulo-rename-fix

**Mode**: Standard (TDD not active, though standard unit tests aligned)

## Completed Tasks

### Phase 1: Symlink & Models
- [x] 1.1 Re-create symlink `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/shared` pointing to `../../codigo/backend/src/shared`
- [x] 1.2 Update `Articulo` interface in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/api/articulos.ts` to map `codigo` (string) and `nombre` (string)
- [x] 1.3 Update `ArticuloRutaPasadaItem` nested fields in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/api/articulos-ruta.ts`

### Phase 2: UI Pages
- [x] 2.1 Refactor table columns, search fields, and modal form inputs in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/features/dashboard/pages/ArticulosPage.tsx`
- [x] 2.2 Update combo box options and assigned list formatting in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/features/dashboard/pages/RutaFormPage.tsx`
- [x] 2.3 Update article table cell rendering to display code and name in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/features/dashboard/pages/PasadasActivasPage.tsx`
- [x] 2.4 Refactor `getArticuloNombre` helper to format brand-code in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/features/tablet/components/PasadaCard.tsx`
- [x] 2.5 Render composite `Brand - Code` name in topbar of `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/features/tablet/pages/TabletWorkspace.tsx`

### Phase 3: Tests & Mock Handlers
- [x] 3.1 Update `articulosMock` and MSW handlers in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/test/handlers.ts` to match the new schema
- [x] 3.2 Update column assertions, input selectors, and payloads in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/features/dashboard/pages/ArticulosPage.test.tsx`
- [x] 3.3 Update combobox selection options text assertions in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/features/dashboard/pages/RutaFormPage.test.tsx`
- [x] 3.4 Adjust mock article fields and assertions in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/features/tablet/components/PasadaCard.test.tsx`
- [x] 3.5 Align payload schema and assertions in `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename/src/api/rutas-pasadas-articulos.test.ts`

## Work Unit Evidence

| Evidence | Required value |
|---|---|
| Focused test command and exact result | `npm run test` (executed vitest suite covering `ArticulosPage.test.tsx`, `RutaFormPage.test.tsx`, `PasadaCard.test.tsx`, and `rutas-pasadas-articulos.test.ts`) |
| Runtime harness command/scenario and exact result | N/A (low line count change propagating existing entity renaming) |
| Rollback boundary | Revert Git commits / recreate symlink to `../../backend/src/shared` |

## Summary of Changes

### Models & API Client
- Recreated relative symlink in `src/shared` to resolve types against `../../codigo/backend/src/shared`.
- Updated `Articulo` interface fields: `codigo` (string, required) and `nombre` (string, optional).
- Updated `ArticuloRutaPasadaItem` nested object properties in `src/api/articulos-ruta.ts` to map `codigo` and `nombre`.

### UI Components
- **ArticulosPage.tsx**: Translated headers to "Código" and "Nombre". Form fields now write to `codigo` and `nombre` values. Default filter key updated to search by code (`codigo`).
- **RutaFormPage.tsx**: Combobox maps and formats option text as `[codigo] nombre`. Assigned list renders code inside brackets and then name. Local state uses `codigo` and `nombre` properties.
- **PasadasActivasPage.tsx**: Displays article column using composite format `[codigo] nombre`.
- **PasadaCard.tsx**: Refactored `getArticuloNombre` helper to produce `Brand - Code` composite string (`nombre - codigo`).
- **TabletWorkspace.tsx**: Renders composite name `Brand - Code` in workspace topbar.

### Test Suites & Handlers
- **handlers.ts**: Mock data modified to match the new type schema. Mocks for pivot tables aligned to use new nested fields.
- **ArticulosPage.test.tsx**: Column header existence assertion flipped to expect "Código" column header to be present. Selectors modified to retrieve form input elements by labels "Código" and "Nombre".
- **RutaFormPage.test.tsx**: Option selection text assertions updated to expect `[codigo] nombre` format (e.g. `[Sal fina] MarcaC`).
- **PasadaCard.test.tsx**: Updated article mock data inside the pasada test instances to match new structure.
- **rutas-pasadas-articulos.test.ts**: Payload format aligned to return `codigo` and `nombre`, test assertions adjusted.
