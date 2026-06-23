# Proposal: frontend-rutas-abm

## Intent

### Problem
The Rutas (rutas-pasadas) frontend feature is in an inconsistent state:

1. **`articulo` field is wrong.** `RutaPasadaEtapa` carries `articulo: number`, the `RutaFormPage` renders an Artículo picker per etapa, and the validation schema/tests assert on it. The backend entity has **no `articulo` field** on a route stage — it never did. This makes create/edit payloads carry a phantom field.

2. **Tests contradict the chosen architecture.** The current `RutasPage.test.tsx` was written for an inline-modal CRUD pattern (it queries for a `heading "Editar Ruta"`, an `"Activar Ruta"` button, and an in-page `"Guardar"` button). But `RutasPage.tsx` actually uses `useNavigate` to a separate full-page form (`/dashboard/rutas/new`, `/dashboard/rutas/:id`). Every modal-dependent test FAILS today. The page and its tests are out of sync.

3. **`RutaFormPage` has no behavioral coverage.** `RutaFormPage.test.tsx` only unit-tests the Zod schemas. The actual create/edit/etapas sub-form behavior (pre-fill on edit, add/remove/reorder rows, submit payload shape) is untested.

4. **Mock data lacks etapas.** `rutasMock` / `rutasMockInactivos` have no `etapas` arrays, so edit pre-fill cannot be tested, and there is no GET-by-id handler for the form's `getRuta` call.

### Why now
This feature is part of the dashboard ABM set being brought to the gold standard (EtapasPage/ArticulosPage). It is the only ABM whose tests are red and whose types diverge from the backend contract. Leaving `articulo` in place risks shipping invalid payloads to the route-stages endpoint.

### Success looks like
- `RutaPasadaEtapa` and the form match the real backend contract (no `articulo`; nested `etapa` detail on read, `etapa` as an ID on write).
- The Rutas list page (`RutasPage`) is a pure listing surface; create/edit lives in the full-page `RutaFormPage`.
- All Rutas tests are green and actually test the **navigate-based** flow plus the etapas sub-form.
- `pnpm test run` passes with no `articulo` references anywhere in the Rutas feature.

## Scope

### In scope
- Fix Rutas API types in `frontend/src/api/rutas.ts` (remove `articulo`, add `EtapaDetalle`, add `RutaPasadaEtapaCreate`, retype `Ruta.etapas`, `RutaCreate`).
- Keep `RutaFormPage.tsx` as the full-page create/edit form; remove the `articulo` picker and `articulos` query from it.
- Keep `RutasPage.tsx` as a list-only page (search, active/inactive partitions, table rows, navigate-to-form, inline activate, `window.confirm` delete). Minor cleanup only — no modal introduction.
- Rewrite `RutasPage.test.tsx` to test the **navigation** pattern (mock `useNavigate`), search/filter, activate, and delete-confirm — not a modal.
- Expand `RutaFormPage.test.tsx` to cover component behavior: create-with-etapas, edit pre-fills etapas, add/remove/reorder etapa rows, validation errors. Update the existing schema tests to drop `articulo`.
- Update `frontend/src/test/handlers.ts`: add `etapas` arrays to route mocks, add a GET `/rutas-pasadas/:id` handler.
- Remove no routes — `/dashboard/rutas/new` and `/dashboard/rutas/:id` in `App.tsx` stay (the full-page form is the confirmed design).

### Out of scope
- Backend changes of any kind (this is a frontend-only change).
- Converting Rutas to an inline-modal pattern (explicitly rejected — the etapas sub-form has too many fields for a modal).
- Changes to other ABM pages (Etapas, Articulos, Usuarios, Lineas).
- Reordering persistence semantics beyond sending `orden = index + 1` on submit (already the current behavior).
- Pagination, server-side search, or optimistic updates.

## Affected Files

| File | Change |
|------|--------|
| `frontend/src/api/rutas.ts` | Remove `articulo` from `RutaPasadaEtapa`; add `EtapaDetalle`; make `RutaPasadaEtapa.etapa` a nested `EtapaDetalle` (read shape); add `RutaPasadaEtapaCreate` (write shape with `etapa: number`); retype `Ruta.etapas` and `RutaCreate.etapas`. |
| `frontend/src/features/dashboard/pages/RutaFormPage.tsx` | Remove `articulo` from `etapaSchema`, the `append()` defaults, the edit `reset()` mapping, and the per-row Artículo `<select>`; remove the `getArticulos` query and import; map read `etapa` object → form `etapa` id on edit pre-fill. |
| `frontend/src/features/dashboard/pages/RutaFormPage.test.tsx` | Drop `articulo` from all schema fixtures; add component-level tests (create, edit pre-fill, add/remove/reorder rows, validation). |
| `frontend/src/features/dashboard/pages/RutasPage.tsx` | Keep list-only behavior; minor cleanup (remove unused `createRuta`/`RutaCreate`/`X` imports if they become dead; keep `updateRuta` for activate, `deleteRuta` for delete). |
| `frontend/src/features/dashboard/pages/RutasPage.test.tsx` | Rewrite to test navigation (mock `useNavigate`), search filter, activate PUT, delete confirm — remove all modal assertions. |
| `frontend/src/test/handlers.ts` | Add `etapas` arrays to `rutasMock`/`rutasMockInactivos`; add GET `/rutas-pasadas/:id` handler returning the matching mock (with etapas). |
| `frontend/src/App.tsx` | No change required (routes stay). Listed for awareness only. |

## API Types Fix (`frontend/src/api/rutas.ts`)

The backend uses two distinct shapes for a route stage — a **read** shape (GET returns the full nested etapa) and a **write** shape (POST/PUT sends the etapa as an id). The current single `RutaPasadaEtapa` conflates them and adds a phantom `articulo`.

Proposed types (signatures only — implementation happens in `sdd-apply`):

```ts
// Minimal nested etapa returned by the backend on read.
export interface EtapaDetalle {
  id: number;
  nombre: string;
}

// READ shape: what GET /rutas-pasadas[/:id] returns per stage.
export interface RutaPasadaEtapa {
  id?: number;
  etapa: EtapaDetalle;          // nested object, NOT a number; NO articulo
  orden: number;
  pesoMinimo: number;
  pesoIdeal: number;
  pesoMaximo: number;
  cantidadMuestrasRequeridas: number;
}

// WRITE shape: what POST/PUT sends per stage.
export interface RutaPasadaEtapaCreate {
  id?: number;
  etapa: number;                // etapa id; NO articulo
  orden: number;
  pesoMinimo: number;
  pesoIdeal: number;
  pesoMaximo: number;
  cantidadMuestrasRequeridas: number;
}

export interface Ruta {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
  etapas?: RutaPasadaEtapa[];   // read shape
}

export interface RutaCreate extends Omit<Ruta, 'id' | 'etapas'> {
  etapas: RutaPasadaEtapaCreate[];  // write shape
}
```

Notes:
- `getRuta`, `createRuta`, `updateRuta` signatures stay; only the generic payload types tighten.
- The form maps read → form values (`etapa: e.etapa.id`) on edit pre-fill, and form values → write shape (`etapa: number`, `orden: index + 1`) on submit. This removes the current `as unknown as` cast in `onSubmit`.

## MSW Handler Updates (`frontend/src/test/handlers.ts`)

1. **Add `etapas` to route mocks.** At least `rutasMock[0]` ("Ruta Alpha") and `rutasMockInactivos[0]` ("Ruta Delta") get a non-empty `etapas` array using the **read** shape (`etapa: { id, nombre }`, `orden`, weights, `cantidadMuestrasRequeridas`), referencing `etapasMock` entries. This enables edit-pre-fill tests.

2. **Add GET `/rutas-pasadas/:id`.** Returns the matching entry from `rutasMock` ∪ `rutasMockInactivos` (with its etapas) wrapped in `{ success, data }`. Currently absent; `RutaFormPage`'s `getRuta` would 404 in tests without it.

3. **Keep existing POST/PUT/DELETE handlers** — they already echo the body; assertions on payload shape (no `articulo`, `etapa` as number, `orden` present) read from the captured request.

## Success Criteria

1. `rg "articulo" frontend/src/api/rutas.ts frontend/src/features/dashboard/pages/RutaFormPage.tsx frontend/src/features/dashboard/pages/RutaFormPage.test.tsx` returns no matches.
2. `frontend/src/api/rutas.ts` exports `EtapaDetalle`, `RutaPasadaEtapa` (read), `RutaPasadaEtapaCreate` (write), with `RutaCreate.etapas: RutaPasadaEtapaCreate[]`.
3. `RutasPage` remains list-only: a "Nueva Ruta" control navigates to `/dashboard/rutas/new`, the row edit control navigates to `/dashboard/rutas/:id`, activate fires a PUT `{ activo: true }`, delete fires after `window.confirm`.
4. `RutasPage.test.tsx` asserts navigation via a mocked `useNavigate` (no modal headings/buttons referenced).
5. `RutaFormPage.test.tsx` covers: valid create payload (no `articulo`), nombre required, ≥1 etapa required, edit pre-fills etapas from a mocked GET-by-id, add/remove/reorder rows, and the submit payload sends `etapa` as a number with `orden = index + 1`.
6. Submit payload contains no `articulo` and sends `orden` per row.
7. `cd frontend && pnpm test run` passes (all Rutas suites green), TypeScript compiles with no errors.

## Risks

- **Test rewrite (RutasPage).** The existing `RutasPage.test.tsx` is fundamentally modal-shaped and will be discarded/replaced, not patched. Risk of losing a behavioral case during the rewrite — mitigate by enumerating the kept behaviors (list, search, partition switch, activate PUT, delete confirm) before rewriting. Strict TDD applies: write the new failing tests first.
- **Read vs write shape split.** Splitting `RutaPasadaEtapa` into read/write shapes touches every consumer. If any code reads `etapa` as a number today, it breaks at compile time — that is the intended signal, but it must all be migrated in `sdd-apply`.
- **`articulo` actually required by backend?** Exploration flagged ambiguity. User decision #3 is explicit: `articulo` never existed on the entity and must be removed. Proceeding on that confirmed decision. If a later integration test shows the backend rejecting payloads, that is a separate backend concern (out of scope here).
- **Router cleanup misconception.** Exploration suggested removing `/rutas/new` and `/rutas/:id`. That recommendation assumed a modal pivot and is REJECTED. Routes stay; `App.tsx` is unchanged. Flagging so `sdd-tasks`/`sdd-apply` do not delete them.
- **MSW GET-by-id matching.** The new `/rutas-pasadas/:id` handler must search both active and inactive mock arrays, or edit tests for inactive routes (e.g. "Ruta Delta") will 404.

## Approach Rationale

We keep two surfaces with a clear single responsibility each:
- `RutasPage` = read/scan + lifecycle actions (activate/delete) that need no complex form.
- `RutaFormPage` = the heavy create/edit form whose etapas sub-form (six fields per row plus reorder) does not fit a modal.

This honors the user's confirmed decisions, matches the existing component structure (minimal churn), and isolates the real defects: the phantom `articulo` field and the modal-shaped tests that never matched the navigate-based page. The type split (read `EtapaDetalle` vs write id) is the smallest correct model of the backend contract and removes the existing unsafe cast in `onSubmit`.
