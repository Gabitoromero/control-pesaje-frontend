# Design: Frontend Routes and Stages Management

## Technical Approach
Implement dedicated React pages for creating and editing routes, moving away from the previous modal-based approach. The form will use `react-hook-form` and `yup` (or `zod`) for validation. `useFieldArray` will manage the dynamic list of stages, providing simple up/down controls for reordering.

## Architecture Decisions
### Decision: State Management for Dynamic Form
**Choice**: `useFieldArray` from `react-hook-form`
**Alternatives considered**: Local component state (`useState`) with manual array mapping.
**Rationale**: `useFieldArray` is designed specifically for dynamic arrays within forms, handling focus management, re-rendering optimizations, and simple `move`, `append`, and `remove` methods out of the box.

## Data Flow
1. User navigates to `/rutas/new`.
2. Component fetches available `Articulos` and `Etapas` for dropdowns via existing query hooks.
3. User fills out route details and adds stages.
4. On submit, form data is mapped to the `RutaCreate` payload (which includes `etapas`).
5. A mutation hook sends the POST request to `/api/rutas-pasadas`.
6. On success, user is navigated back to the list view.

## File Changes
| File | Action | Description |
|------|--------|-------------|
| `frontend/src/features/dashboard/pages/RutasPage.tsx` | Modify | Update "Nueva Ruta" button to redirect to `/rutas/new`. Remove modal. |
| `frontend/src/features/dashboard/pages/RutaFormPage.tsx` | New | Main page component hosting the form. |
| `frontend/src/api/rutas.ts` | Modify | Add `etapas` to `RutaCreate` and `Ruta` interfaces. |
| `frontend/src/router/index.tsx` (or similar) | Modify | Add route definitions for `/rutas/new` and `/rutas/:id`. |

## Interfaces / Contracts
Update `RutaCreate` interface to include:
```typescript
etapas: {
  id?: number;
  articulo: number;
  etapa: number;
  orden: number;
  pesoIdeal: number;
  pesoMinimo: number;
  pesoMaximo: number;
  cantidadMuestrasRequeridas: number;
}[];
```

## Testing Strategy
| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Validation schemas | Test that missing stage fields correctly throw validation errors. |

## Migration / Rollout
No backend migration required. Frontend simply updates route definitions.

## Open Questions
None
