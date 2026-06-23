# Tasks: frontend-rutas-abm

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 350–450 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR (frontend-only, ~5–7 files) |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All 7 tasks | Single PR | Types → handlers → tests (RED) → impl (GREEN) → cleanup |

---

## Phase 1: Foundation — Types and Mock Data

- [x] T1.1 `frontend/src/api/rutas.ts` — add `EtapaDetalle` interface; rewrite `RutaPasadaEtapa` (read shape, `etapa: EtapaDetalle`, no `articulo`); add `RutaPasadaEtapaCreate` (write shape, `etapa: number`, no `articulo`); update `Ruta.etapas` to `RutaPasadaEtapa[]`; add `RutaCreate.etapas: RutaPasadaEtapaCreate[]`; add `RutaUpdate` type; retype `updateRuta` second param to `RutaUpdate`.
  - RED: TypeScript errors on any consumer still using the old single-shape `articulo` field.
  - GREEN: All interfaces compile; no `articulo` in `rutas.ts`.

- [x] T1.2 `frontend/src/test/handlers.ts` — add `etapas` arrays (read shape) to `rutasMock[0]` ("Ruta Alpha", 2 etapas) and `rutasMockInactivos[0]` ("Ruta Delta", 1 etapa); add GET `/api/rutas-pasadas/:id` handler after the `/inactive` handler, searching both arrays, returning `{ success, data }` or 404. Verify existing GET `/api/etapas` handler is already present (no action if yes).
  - RED: `getRuta` call in form tests returns 404; edit pre-fill tests cannot run.
  - GREEN: GET by id resolves with etapas for ids 1 and 4; unknown ids return 404.

---

## Phase 2: RED Tests — Write Failing Tests First (Strict TDD)

- [x] T2.1 `frontend/src/features/dashboard/pages/RutasPage.test.tsx` — rewrite. Remove all modal-shaped assertions (`heading "Editar Ruta"`, in-page `"Activar Ruta"`, in-page `"Guardar"`). Add `useNavigate` mock (from `SeleccionLineaPage.test.tsx` pattern). Assert these 8 behaviors: (1) active partition shows only activos, (2) inactive partition shows only inactivos, (3) search filters by nombre, (4) row count matches mock length, (5) "Nueva Ruta" calls `navigate('/dashboard/rutas/new')`, (6) row Edit icon calls `navigate('/dashboard/rutas/<id>')`, (7) Activar PUT fires `{ activo: true }`, (8) delete fires on confirm / does not fire on cancel.
  - RED: tests fail because `RutasPage.tsx` still imports `createRuta`/`RutaCreate`/`X` (compile errors) and modal queries find nothing.
  - GREEN: after T3.1, all 8 pass.

- [x] T2.2 `frontend/src/features/dashboard/pages/RutaFormPage.test.tsx` — keep existing schema unit tests; drop `articulo` from every fixture. Add component `describe` block with `useParams`/`useNavigate` mocks. Write 8 component cases as failing tests: (1) create valid payload no `articulo`, (2) nombre required, (3) ≥1 etapa required, (4) edit pre-fills etapas from GET-by-id, (5) add row, (6) remove row (multi), (7) remove disabled (single row), (8) reorder rows and assert `orden` in PUT body.
  - RED: component tests fail (form still has `articulo`; submit payload shape wrong; edit pre-fill maps `e.etapa` instead of `e.etapa.id`).
  - GREEN: after T4.1, all component cases pass.

---

## Phase 3: GREEN Implementation — Make Tests Pass

- [x] T3.1 `frontend/src/features/dashboard/pages/RutasPage.tsx` — remove dead imports: `createRuta`, `RutaCreate`, `X`, and `createMutation` block. Switch `updateMutation` second param to `RutaUpdate`. No structural or navigation change (navigate calls already correct on lines 134 and 177).
  - GREEN for T2.1.
  - REFACTOR: file stays identical in behavior; only dead code removed.

- [x] T4.1 `frontend/src/features/dashboard/pages/RutaFormPage.tsx` — six targeted edits: (a) remove `getArticulos` import and query; (b) delete `articulo` from `etapaSchema`; (c) delete `articulo: 0` from `append` defaults; (d) rewrite edit `reset()` mapping (`etapa: e.etapa.id`, no `articulo`); (e) delete the `etapas.${index}.articulo` register block and its `<select>` element; (f) rewrite `onSubmit` with explicit field-by-field map producing `RutaPasadaEtapaCreate[]` (no `as unknown as`); (g) add `onError` to `createMutation` and `updateMutation` (mirror list page `isAxiosError → alert` pattern); (h) add `aria-label`s to row action buttons (`"Subir etapa"`, `"Bajar etapa"`, `"Eliminar etapa"`) if test queries prove brittle.
  - GREEN for T2.2.
  - REFACTOR: import block tidied; Zod schemas stay in this file (ADR-4).

---

## Phase 4: Verification and Cleanup

- [x] T5.1 Run `cd frontend && pnpm test run`. Fix any remaining TypeScript compile errors or broken imports surfaced by the type split. Confirm no file in `frontend/src/` references `articulo` on a ruta-stage type: `rg "articulo" frontend/src/api/rutas.ts frontend/src/features/dashboard/pages/RutaFormPage.tsx frontend/src/features/dashboard/pages/RutaFormPage.test.tsx` returns zero matches.

- [x] T5.2 Run `tsc --noEmit` from `frontend/`. Confirm TypeScript reports zero errors. Confirm `updateRuta` call on list page (`{ activo: true }`) still type-checks under `RutaUpdate`.
