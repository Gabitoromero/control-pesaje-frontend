# Design: frontend-rutas-abm

## Approach Summary

Two-surface ABM, no modal for create/edit. `RutasPage` is a pure listing surface
(search, partitions, navigate, inline activate/delete). `RutaFormPage` is the full-page
RHF + `useFieldArray` create/edit form. The single architectural change of substance is
splitting the conflated `RutaPasadaEtapa` type into a **read shape** (nested `etapa`
object) and a **write shape** (`etapa` as id), and removing the phantom `articulo` field
everywhere. Everything else is alignment of tests and mocks to the already-present
navigate-based design.

This is a refactor-and-realign change, not a new architecture. The component boundaries
are confirmed and frozen by the proposal. The design's job is to remove the type lie,
remove `articulo`, and make tests assert the real flow.

---

## D1 — `frontend/src/api/rutas.ts` type changes

### Final type definitions (read/write split)

```ts
import api from './axios';

// Minimal nested etapa returned by the backend on read.
export interface EtapaDetalle {
  id: number;
  nombre: string;
}

// READ shape: what GET /rutas-pasadas[/:id] returns per stage.
export interface RutaPasadaEtapa {
  id?: number;
  etapa: EtapaDetalle;          // nested object on read; NO articulo
  orden: number;
  pesoMinimo: number;
  pesoIdeal: number;
  pesoMaximo: number;
  cantidadMuestrasRequeridas: number;
}

// WRITE shape: what POST/PUT sends per stage.
export interface RutaPasadaEtapaCreate {
  id?: number;
  etapa: number;                // etapa id on write; NO articulo
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
  etapas?: RutaPasadaEtapa[];        // read shape
}

export interface RutaCreate extends Omit<Ruta, 'id' | 'etapas'> {
  etapas: RutaPasadaEtapaCreate[];   // write shape
}

export type RutaUpdate = Partial<Omit<RutaCreate, 'etapas'>> & {
  etapas?: RutaPasadaEtapaCreate[];
  activo?: boolean;
};
```

### Function signatures

- `getRutas`, `getRutasInactivas`: **unchanged** (return `Ruta[]`).
- `getRuta(id: number): Promise<Ruta>`: **already exists** (line 41-44). No new
  `getRutaById` function is needed — the proposal's `getRuta` is the by-id fetch. Decision:
  keep the name `getRuta`; do NOT add a duplicate `getRutaById`.
- `createRuta(ruta: RutaCreate): Promise<Ruta>`: signature unchanged; the tightened
  `RutaCreate.etapas` type now forbids `articulo` and forces `etapa: number`. This removes
  the `as unknown as` cast at the call site.
- `updateRuta(id: number, ruta: Partial<Ruta>): Promise<Ruta>`: **retype the second param**
  to `RutaUpdate` so an update payload can carry write-shape etapas plus `activo`. The list
  page's activate call (`{ activo: true }`) still type-checks under `RutaUpdate`.
- `deleteRuta`: unchanged.

### Decision: where do the Zod schemas live?

**Keep the Zod schemas inline in `RutaFormPage.tsx`** (`etapaSchema`, `rutaSchema`),
exactly as today. Rationale:
- They are exported already and the existing `RutaFormPage.test.tsx` imports them from the
  component file. Moving them to `rutas.ts` would force a test-import rewrite for no benefit.
- The schemas are form-validation concerns (UI shape), not API-transport concerns. `rutas.ts`
  is the transport layer; mixing Zod form schemas there blurs the boundary.
- The form value shape (`etapa: number`, no `articulo`) is distinct from both the read and
  write API shapes; it belongs next to the form that owns it.

`rutas.ts` stays Zod-free; it only declares TypeScript interfaces. This preserves the
existing layering (api = transport types, page = form schema).

---

## D2 — `frontend/src/features/dashboard/pages/RutasPage.tsx`

### Keep (no change)
- `useQuery` for `rutas` + `rutas-inactivos`, `SearchToolbar`, `rutasFiltradas` memo,
  active/inactive partition, table rendering, `useNavigate`.
- `updateMutation` (used for activate), `deleteMutation`, `handleActivar`, `handleDelete`.
- `window.confirm` for delete (line 110-114) — **keep `window.confirm`, do NOT introduce
  inline confirm state.** It matches the existing pattern and is trivially testable by
  spying on `window.confirm`.
- Activate uses **invalidate** (`invalidateQueries(['rutas'])` + `['rutas-inactivos']`),
  NOT optimistic update. Decision: keep invalidate. Optimistic updates are explicitly out
  of scope (proposal) and add rollback complexity for no UX gain here.

### Change (cleanup only)
- Remove now-dead imports: `createRuta` and `X` are unused on the list page (create lives
  in the form; `X` was a modal-close icon). `RutaCreate` is still referenced by
  `updateMutation`'s param type — **either** keep `RutaCreate` import **or** switch that
  param type to `RutaUpdate`. Decision: switch `updateMutation` param to
  `Partial<RutaUpdate>` / `RutaUpdate` and drop the `createRuta`, `RutaCreate`, and `X`
  imports. Keep `updateRuta`, `deleteRuta`, `getRutas`, `getRutasInactivas`, `type Ruta`.
- `createMutation` is unused on this page (no create here) — **remove it** along with its
  error handler. Create is fully owned by `RutaFormPage`.

### Navigation calls (exact)
- New: `onClick={() => navigate('/dashboard/rutas/new')}` (already present, line 134).
- Edit row: `onClick={() => navigate(\`/dashboard/rutas/${ruta.id}\`)}` (already present,
  line 177).

No structural change to navigation; it already exists and is correct.

---

## D3 — `frontend/src/features/dashboard/pages/RutaFormPage.tsx`

### Zod schema (final, `articulo` removed)

```ts
export const etapaSchema = z.object({
  id: z.number().optional(),
  etapa: z.coerce.number().min(1, 'Requerido'),
  pesoMinimo: z.coerce.number().min(0, 'Mínimo 0'),
  pesoMaximo: z.coerce.number().min(0, 'Mínimo 0'),
  pesoIdeal: z.coerce.number().min(0, 'Mínimo 0'),
  cantidadMuestrasRequeridas: z.coerce.number().min(1, 'Mínimo 1'),
});

export const rutaSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido'),
  descripcion: z.string().optional(),
  etapas: z.array(etapaSchema).min(1, 'Debe agregar al menos una etapa'),
});

type RutaFormValues = z.infer<typeof rutaSchema>;
```

The single change to the schema is deleting the `articulo` line. Order of fields is
preserved so the existing `issues[0]` assertions for `nombre`/etapas remain valid.

### useFieldArray field names (exact)
`name: 'etapas'`; per-row register paths:
`etapas.${index}.etapa`, `etapas.${index}.pesoMinimo`, `etapas.${index}.pesoIdeal`,
`etapas.${index}.pesoMaximo`, `etapas.${index}.cantidadMuestrasRequeridas`. The
`etapas.${index}.articulo` register and its `<select>` block (lines 200-214) are **deleted**.

### Etapa picker
- Keep the **native `<select>`** populated from `useQuery(['etapas'], getEtapas)`. Decision:
  do NOT introduce react-select. Native select matches the existing component and the gold
  standard, has zero new deps, and is trivially driven in tests via
  `userEvent.selectOptions`. The first option stays `<option value={0}>Seleccione...</option>`
  so an untouched row fails `min(1)` validation.
- Remove the `getArticulos` query and its import (line 8, 36). Remove the `articulos`
  destructure.

### Append defaults (exact)
```ts
append({
  etapa: 0,
  pesoMinimo: 0,
  pesoMaximo: 0,
  pesoIdeal: 0,
  cantidadMuestrasRequeridas: 1,
});
```
(`articulo: 0` removed.)

### Edit mode: how data loads
- **`useQuery` by id** (`['ruta', id]`, `queryFn: () => getRuta(Number(id))`,
  `enabled: isEditing`) — already present (lines 39-43). Decision: keep the query-by-id
  approach. Do NOT pass data via router state; query-by-id survives a direct URL hit / page
  refresh and is the only approach testable through MSW.
- Pre-fill mapping (`reset`) must convert the **read shape** nested etapa to the form's id:
  ```ts
  etapas: ruta.etapas?.map(e => ({
    id: e.id,
    etapa: e.etapa.id,        // read object -> form id
    pesoMinimo: e.pesoMinimo,
    pesoMaximo: e.pesoMaximo,
    pesoIdeal: e.pesoIdeal,
    cantidadMuestrasRequeridas: e.cantidadMuestrasRequeridas,
  })) ?? []
  ```
  (`articulo: e.articulo` line removed; `etapa: e.etapa` becomes `etapa: e.etapa.id`.)

### `orden` assignment + submit mapping
`onSubmit` maps form values to the **write shape**, assigning `orden = index + 1`:
```ts
const onSubmit = (data: RutaFormValues) => {
  const etapas: RutaPasadaEtapaCreate[] = data.etapas.map((e, index) => ({
    ...(e.id != null ? { id: e.id } : {}),
    etapa: e.etapa,
    orden: index + 1,
    pesoMinimo: e.pesoMinimo,
    pesoIdeal: e.pesoIdeal,
    pesoMaximo: e.pesoMaximo,
    cantidadMuestrasRequeridas: e.cantidadMuestrasRequeridas,
  }));
  const payload: RutaCreate = {
    nombre: data.nombre,
    descripcion: data.descripcion?.trim() || null,
    etapas,
  };
  if (isEditing) updateMutation.mutate({ id: Number(id), data: payload });
  else createMutation.mutate(payload);   // no `as unknown as` cast anymore
};
```
The explicit field-by-field map (instead of spread) guarantees no `articulo` leaks into the
payload even if a stray field exists, and yields a typed `RutaPasadaEtapaCreate[]` that
drops the current unsafe cast.

### Error handling
Add `onError` to both `createMutation` and `updateMutation` mirroring the list page's
`isAxiosError` → `alert(...)` pattern, so a failed save surfaces a message rather than
silently doing nothing. Keep the existing `onSuccess`: invalidate `['rutas']` (+
`['rutas-inactivos']`) and `navigate('/dashboard/rutas')`.

---

## D4 — `frontend/src/test/handlers.ts`

### Mock data additions (read shape with nested etapa)

Add `etapas` arrays to at least `rutasMock[0]` ("Ruta Alpha", active) and
`rutasMockInactivos[0]` ("Ruta Delta", inactive), referencing `etapasMock` entries:

```ts
export const rutasMock = [
  {
    id: 1, nombre: 'Ruta Alpha', descripcion: 'Descripción Alpha', activo: true,
    etapas: [
      { id: 10, etapa: { id: 1, nombre: 'Amasado' },  orden: 1, pesoMinimo: 10, pesoIdeal: 15, pesoMaximo: 20, cantidadMuestrasRequeridas: 2 },
      { id: 11, etapa: { id: 2, nombre: 'Horneado' }, orden: 2, pesoMinimo: 30, pesoIdeal: 35, pesoMaximo: 40, cantidadMuestrasRequeridas: 1 },
    ],
  },
  { id: 2, nombre: 'Ruta Beta',  descripcion: null,                activo: true, etapas: [] },
  { id: 3, nombre: 'Ruta Gamma', descripcion: 'Descripción Gamma', activo: true, etapas: [] },
];

export const rutasMockInactivos = [
  {
    id: 4, nombre: 'Ruta Delta', descripcion: 'Ruta inactiva D', activo: false,
    etapas: [
      { id: 40, etapa: { id: 3, nombre: 'Envasado' }, orden: 1, pesoMinimo: 5, pesoIdeal: 7, pesoMaximo: 9, cantidadMuestrasRequeridas: 3 },
    ],
  },
  { id: 5, nombre: 'Ruta Epsilon', descripcion: null,            activo: false, etapas: [] },
];
```

Note: the list-page tests only assert on `nombre`/`descripcion`/row count, so adding
`etapas` does not break them. The `row count matches mock length` test still holds
(`rutasMock.length + 1`).

### New GET `/rutas-pasadas/:id` handler

Must search **both** active and inactive arrays (otherwise editing "Ruta Delta" 404s):

```ts
http.get(`${BASE}/rutas-pasadas/:id`, ({ params }) => {
  const id = Number(params.id);
  const found = [...rutasMock, ...rutasMockInactivos].find(r => r.id === id);
  if (!found) return HttpResponse.json({ success: false, message: 'No encontrada' }, { status: 404 });
  return HttpResponse.json({ success: true, data: found });
}),
```

**Ordering caveat (MSW):** register this `/:id` handler **after** the static
`/rutas-pasadas/inactive` handler. MSW matches in registration order; if `/:id` is
registered first it will capture `/inactive` (treating `"inactive"` as an id). Keep
`/rutas-pasadas`, then `/rutas-pasadas/inactive`, then `/rutas-pasadas/:id`.

### GET `/api/etapas`
**Already exists** (handlers.ts line 147-149) returning `etapasMock`. No addition needed for
the form's etapa picker query. The picker options will be Amasado/Horneado/Envasado.

### POST/PUT/DELETE `/rutas-pasadas`
Keep as-is (they echo the body). Payload-shape assertions read from the captured request.

---

## D5 — Test approach

### `RutasPage.test.tsx` (rewrite — navigate-based, not modal)

Use the established `useNavigate` mock pattern (copied from
`SeleccionLineaPage.test.tsx`):

```ts
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});
```

Reset between tests: `afterEach(() => { navigateMock.mockClear(); server.resetHandlers(); })`.

Kept behaviors to assert (enumerated so the rewrite loses nothing):
1. Default mount shows only activos (Alpha/Beta/Gamma; not Delta/Epsilon). — keep as-is.
2. Switching status to inactivo shows only inactivos. — keep as-is.
3. Search filters active partition by nombre; clearing restores. — keep as-is.
4. `row count === rutasMock.length + 1`. — keep as-is.
5. **New**: clicking "Nueva Ruta" calls `navigate('/dashboard/rutas/new')`.
6. **New**: clicking a row's Edit (`getByTitle('Editar')`) calls
   `navigate('/dashboard/rutas/4')` (use Delta's id, or assert the called path matches
   `/dashboard/rutas/<id>`).
7. **New**: on an inactive row, clicking "Activar" fires PUT to `/rutas-pasadas/:id` with
   `{ activo: true }` (capture request body via a `server.use` override, mirror the existing
   pattern).
8. **New**: delete — spy `vi.spyOn(window, 'confirm')`. When it returns `true`, a DELETE to
   `/rutas-pasadas/:id` fires; when `false`, no DELETE fires. Restore the spy in `afterEach`.

**Discarded** (modal-shaped, no longer valid): every assertion on
`heading "Editar Ruta"`, in-page `button "Activar Ruta"`, in-page `button "Guardar"`, and
the "clearing descripcion sends null" tests (those belong to the form page now). Removing
them is intentional — they tested a modal that never existed on this page.

### `RutaFormPage.test.tsx` (expand to component behavior)

Keep the existing schema unit tests (`rutaSchema`/`etapaSchema`) but **drop `articulo`**
from every fixture. Add a second `describe` block for component behavior.

Setup for component tests:
- MSW server with `handlers` (provides GET `/etapas`, GET `/rutas-pasadas/:id`, POST/PUT).
- Mock `useParams` for edit mode + `useNavigate` to assert post-save redirect:
  ```ts
  const navigateMock = vi.fn();
  let paramsMock: { id?: string } = {};
  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => navigateMock, useParams: () => paramsMock };
  });
  ```
  Set `paramsMock = {}` for create tests, `paramsMock = { id: '1' }` (Alpha) or
  `{ id: '4' }` (Delta) for edit tests, in `beforeEach`/per test. Reset `navigateMock` each test.
- Render with `renderWithProviders(<RutaFormPage />)` — it already wraps `MemoryRouter` +
  `QueryClientProvider`. Because `useParams`/`useNavigate` are mocked, the bare
  `MemoryRouter` (no `initialEntries` needed) is sufficient; routing is not exercised, only
  the hooks.

Component cases:
1. **Create — valid payload, no `articulo`**: type nombre, click "Agregar Etapa", select an
   etapa option (Amasado), fill weights + muestras, submit. Capture POST body via
   `server.use` override; assert no `articulo` key, `etapa` is a number (1), `orden === 1`,
   and `navigateMock` called with `/dashboard/rutas`.
2. **nombre required**: submit with empty nombre + one etapa → assert
   `'Nombre es requerido'` is shown and no POST fired.
3. **≥1 etapa required**: submit with nombre and zero rows → assert
   `'Debe agregar al menos una etapa'`.
4. **Edit pre-fills etapas**: `paramsMock = { id: '1' }`; wait for the GET-by-id; assert two
   etapa rows render and each etapa `<select>` has the mock's etapa selected (Amasado on row
   0, Horneado on row 1). Assert weight inputs carry mock values.
5. **Add row**: click "Agregar Etapa", assert one more etapa `<select>` appears.
6. **Remove row**: in an edit with 2 rows, click the row Trash, assert one row remains.
7. **Reorder**: in edit, click row-1 ArrowUp, assert the order of selected etapa values
   swaps; then submit and assert the captured PUT body has `orden` 1..n following the new
   visual order (Horneado now `orden: 1`).
8. **Submit payload shape**: assert each etapa in the captured body has `etapa: <number>`
   and `orden === arrayIndex + 1`, and the body contains no `articulo`.

useFieldArray interaction note: rows are matched by querying within the etapa card
containers. Prefer scoping by the etapa `<select>` elements (`getAllByRole('combobox')`
minus the SearchToolbar — but the form has no SearchToolbar, so all comboboxes are etapa
selects) and by `getByTitle`-style controls if titles are added, or by button text/icon.
If reorder/remove targeting proves brittle, add `aria-label`s (e.g. `Subir etapa`,
`Eliminar etapa`) to the row buttons during apply — this is the recommended low-risk
adjustment and is the only DOM affordance change the tests may require.

---

## Components / Data Flow

```
RutasPage (list)
  ├─ useQuery getRutas / getRutasInactivas  -> read Ruta[] (etapas read-shape, unused in list)
  ├─ navigate('/dashboard/rutas/new')        -> RutaFormPage (create)
  ├─ navigate('/dashboard/rutas/:id')        -> RutaFormPage (edit)
  ├─ updateMutation { activo: true }         -> PUT /rutas-pasadas/:id  (invalidate)
  └─ deleteMutation (window.confirm)         -> DELETE /rutas-pasadas/:id

RutaFormPage (create/edit, RHF + useFieldArray)
  ├─ useQuery getEtapas                       -> <select> options
  ├─ useQuery getRuta(id) [edit only]         -> reset() pre-fill (etapa.id -> form etapa)
  ├─ onSubmit map -> RutaCreate (write shape, etapa:number, orden:index+1)
  ├─ createMutation -> POST /rutas-pasadas    -> invalidate + navigate back
  └─ updateMutation -> PUT  /rutas-pasadas/:id-> invalidate + navigate back
```

## Integration Points
- `frontend/src/api/etapas.ts::getEtapas` — etapa picker source (unchanged).
- MSW handlers — GET `/etapas` (exists), GET `/rutas-pasadas/:id` (new, both partitions).
- `App.tsx` routes `/dashboard/rutas/new` and `/dashboard/rutas/:id` — unchanged, kept.

---

## ADR-style Decisions

**ADR-1 — Read/write type split for route stages.**
Decision: `RutaPasadaEtapa` (read, nested `etapa: EtapaDetalle`) vs
`RutaPasadaEtapaCreate` (write, `etapa: number`). Rationale: the backend genuinely returns
a nested object and accepts an id; one type cannot honestly model both and forced the
existing `as unknown as` cast. Rejected: a single union/optional type — it would keep the
cast and let callers read `.etapa.id` or `.etapa` ambiguously.

**ADR-2 — Remove `articulo` entirely (confirmed user decision #3).**
Decision: drop `articulo` from the type, schema, append defaults, edit mapping, the per-row
`<select>`, and all fixtures; remove the `getArticulos` query. Rationale: the field never
existed on the backend entity; keeping it ships invalid payloads. Rejected: leaving it
behind a flag — no backend support, pure dead weight.

**ADR-3 — No modal; keep two surfaces.**
Decision: `RutasPage` list-only, `RutaFormPage` full page. Rationale: six fields per etapa
row plus reorder do not fit a modal; the navigate-based design already exists. Rejected:
inline-modal CRUD (the shape the old tests assumed) — explicitly out of scope and a worse UX
for the sub-form.

**ADR-4 — Zod schemas stay in the page, not in `rutas.ts`.**
Decision: keep `etapaSchema`/`rutaSchema` exported from `RutaFormPage.tsx`. Rationale: form
schema ≠ transport type; existing tests import them from the component; keeps `rutas.ts`
Zod-free. Rejected: centralizing schemas in the api module — blurs the transport/UI boundary
and forces a test-import churn for no gain.

**ADR-5 — Invalidate, not optimistic, for activate/delete.**
Decision: keep `invalidateQueries`. Rationale: optimistic updates are out of scope and add
rollback complexity; the list is small and refetch is cheap. Rejected: optimistic update.

**ADR-6 — `window.confirm` for delete, native `<select>` for pickers.**
Decision: keep both. Rationale: zero new deps, matches gold standard, trivially testable
(`vi.spyOn(window,'confirm')`, `userEvent.selectOptions`). Rejected: inline confirm state and
react-select — unnecessary complexity for this change.

**ADR-7 — Edit loads via `useQuery(getRuta(id))`, not router state.**
Decision: query-by-id. Rationale: survives direct URL/refresh, and is the only path testable
through MSW. Rejected: passing the row object via `navigate` state — breaks on refresh and
is untestable in isolation.

---

## Risks / Assumptions

- **Reorder/remove test targeting may need `aria-label`s** on the row buttons. Low-risk,
  recommended affordance to add during apply if queries prove brittle. (R-1)
- **MSW handler ordering**: `/rutas-pasadas/:id` MUST be registered after `/inactive` or it
  shadows it. Called out in D4. (R-2)
- **Strict TDD**: write the new failing `RutasPage`/`RutaFormPage` tests before the
  component edits. The schema-test `articulo` removal is the one exception that can land with
  the schema change since it is a pure fixture edit.
- **Assumption**: backend GET-by-id returns the same envelope `{ success, data }` and the
  nested `etapa: { id, nombre }` read shape. Confirmed against the proposal's contract; not
  re-verified against the live backend (frontend-only change, out of scope).
- **`updateRuta` retype to `RutaUpdate`** is a small ripple; the list page's
  `{ activo: true }` call must still type-check (it does — all `RutaUpdate` fields optional).
