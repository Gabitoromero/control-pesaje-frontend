# Design: articulo-rename-fix

## Technical Approach

We will propagate the backend `Articulo` field rename (`nombre` -> `codigo`, `marca` -> `nombre`) to the frontend. To achieve this:
1. Re-link `src/shared` to point correctly to `../codigo/backend/src/shared`.
2. Align `Articulo` and `ArticuloRutaPasadaItem` type declarations.
3. Update UI rendering and form fields (translating code as "Código" and brand as "Nombre").
4. Adjust MSW mocks and test assertions in the frontend.

## Architecture Decisions

| Decision | Option | Tradeoff | Decision |
| :--- | :--- | :--- | :--- |
| **Symlink path** | Relative vs Absolute | Absolute path breaks on different dev machines; relative path `../codigo/backend/src/shared` is stable across development environments. | Choose relative symlink path. |
| **Entity type source** | Native duplicate vs Symlinked | Native definitions require duplicate maintenance; symlink to backend shared types guarantees absolute consistency at build time. | Re-link `src/shared` to backend package. |
| **Component Field Mapping** | Map in-place vs Keep old names | Keep old names in state (e.g. state.nombre is code) causes severe cognitive load and future bugs; full renaming in JS state and UI is cleaner. | Rename state properties and UI labels to match backend fields exactly. |

## Data Flow

Data moves from backend API envelopes through `axios` API client wrappers to components:

```
Backend API [codigo, nombre] ──→ API Clients (articulos.ts) ──→ React Components (ArticulosPage, RutaFormPage, PasadaCard)
                                      │
                                      └─→ Resolved via Symlink [src/shared/types/domain.ts]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/shared` | Modify | Re-create symlink pointing to `../codigo/backend/src/shared` |
| `src/api/articulos.ts` | Modify | Update `Articulo` model properties (`codigo` and `nombre`) |
| `src/api/articulos-ruta.ts` | Modify | Update `ArticuloRutaPasadaItem` model nested structure |
| `src/features/dashboard/pages/ArticulosPage.tsx` | Modify | Update form fields, search toolbar keys, sorting logic, and table headers/cells |
| `src/features/dashboard/pages/RutaFormPage.tsx` | Modify | Update Combobox list mapping and local state mapping for assigned items |
| `src/features/dashboard/pages/PasadasActivasPage.tsx` | Modify | Render composite label representing the article |
| `src/features/tablet/components/PasadaCard.tsx` | Modify | Refactor `getArticuloNombre` helper to format `[nombre (brand)] - codigo (code)` |
| `src/features/tablet/pages/TabletWorkspace.tsx` | Modify | Render composite name in topbar |
| `src/test/handlers.ts` | Modify | Align MSW mock articles and pivot routes with the new field schema |
| `src/features/dashboard/pages/ArticulosPage.test.tsx` | Modify | Assert "Código" header presence and update input label selectors |
| `src/features/dashboard/pages/RutaFormPage.test.tsx` | Modify | Align combobox search option queries |
| `src/features/tablet/components/PasadaCard.test.tsx` | Modify | Align mock data assertions |
| `src/api/rutas-pasadas-articulos.test.ts` | Modify | Align mock data assertions |

## Interfaces / Contracts

`src/api/articulos.ts` type update:
```typescript
export interface Articulo {
  id?: number;
  codigo: string; // old nombre
  nombre?: string; // old marca
  descripcion?: string | null;
  activo?: boolean;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit/Integration | `ArticulosPage` | Assert presence of column headers "Código" and "Nombre". Verify form edit/create maps correct payload fields via mock handler assertions. |
| Unit/Integration | `RutaFormPage` | Verify combobox formatting (`[codigo] nombre`) and local item handling before route persistence. |
| Unit/Integration | `PasadaCard` | Verify `getArticuloNombre` yields `Brand - Code` correctly. |
| API | `rutas-pasadas-articulos` | Verify pivot query response maps backend schema to type structure. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No data migration required. Changes are deployed as part of the frontend build.

## Open Questions

None.
