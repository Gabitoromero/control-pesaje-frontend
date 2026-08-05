## Exploration: articulo-rename-fix

### Current State
The backend has renamed fields in the `Articulo` entity: `nombre` was renamed to `codigo`, and `marca` was renamed to `nombre`.
However, the frontend codebase `/home/gtr/work/maciasoft/Controlador Pesaje/frontend-articulo-rename` still references the old fields (`nombre` representing the product name, and `marca` representing the brand) in several API declarations, pages, hooks, tests, and mock handlers. This disparity causes build errors and runtime crashes (e.g. displaying the brand where the name should be, or failing to save/edit articles). Additionally, the symlink `src/shared` is broken.

### Affected Areas
- `src/shared` (Symlink) — The symlink points to `../../backend/src/shared` which is invalid because the backend is located inside `/home/gtr/work/maciasoft/Controlador Pesaje/codigo/backend/src/shared`.
- `src/api/articulos.ts` — The `Articulo` interface defines old properties `marca?: string` and `nombre: string`. It must be changed to `nombre?: string` and `codigo: string`.
- `src/api/articulos-ruta.ts` — The redefined `ArticuloRutaPasadaItem` interface uses `nombre` and `marca`. Needs to use `codigo` and `nombre` to match backend.
- `src/api/rutas-pasadas-articulos.ts` — Maps the returned articles array from the route-article pivot table. Needs type alignment verification.
- `src/features/dashboard/pages/ArticulosPage.tsx` — Manages the state, form, and table view for articles. Still uses `marca` and `nombre` in its form state, table columns, sorting, filtering, and API calls.
- `src/features/dashboard/pages/RutaFormPage.tsx` — Maps article fields when assigning/removing articles to routes. Still references `item.articulo.marca` and `item.articulo.nombre`.
- `src/features/dashboard/pages/PasadasActivasPage.tsx` — Renders `pasada.articulo?.nombre` in the active pasadas table, which will now show the brand (old `marca`) instead of the product code (old `nombre`).
- `src/features/tablet/components/PasadaCard.tsx` — Renders article details for a pasada using `pasada.articulo.marca` and `pasada.articulo.nombre`.
- `src/features/tablet/pages/TabletWorkspace.tsx` — The workspace header casts and renders `articulo?.nombre` which now displays the brand instead of the code.
- `src/test/handlers.ts` — The MSW mock handlers return mock article data using `marca` and `nombre`. These must be renamed to `nombre` and `codigo`.
- `src/features/dashboard/pages/ArticulosPage.test.tsx` — Tests assert table contents and headers with old fields and expect "Código" header not to exist.
- `src/features/dashboard/pages/RutaFormPage.test.tsx` — Tests assert combined option formatting using mock data with old fields.
- `src/features/tablet/components/PasadaCard.test.tsx` — Tests mock pasada article details using `nombre` and `marca` and assert exact text values.
- `src/api/rutas-pasadas-articulos.test.ts` — Test mocks mock response with old properties `nombre` and `marca`.

### Approaches
1. **Direct Propagation and Symlink Fix** — Rename all occurrences of `marca` to `nombre`, and `nombre` to `codigo` on `Articulo` references across components, APIs, tests, and mock handlers. Fix the broken `src/shared` symlink to point to `../../codigo/backend/src/shared`.
   - Pros: Cleans up typing errors completely, prevents runtime bugs, ensures the build passes and tests execute successfully.
   - Cons: Requires modifying several files including test specifications and mock files.
   - Effort: Medium

### Recommendation
Adopt **Approach 1 (Direct Propagation and Symlink Fix)**. This ensures full synchronization between the frontend and the new backend schema, fixing both type errors and potential runtime issues where the brand is shown instead of the article code.

### Risks
- **Broken Symlink**: The symlink `src/shared` currently points to a non-existent path. If it's not fixed, the TypeScript compiler will not find `shared/types/domain` and compilation will fail completely.
- **Test Suite Failures**: Since MSW mock handlers and assertions explicitly check for names and brands (e.g. `expect(screen.getByText('Marca X - Articulo A'))`), renaming backend fields requires carefully updating mocks and corresponding test expectations so they do not break.

### Ready for Proposal
Yes — The frontend exploration is complete. The next phase is to write the specification to implement these changes.
