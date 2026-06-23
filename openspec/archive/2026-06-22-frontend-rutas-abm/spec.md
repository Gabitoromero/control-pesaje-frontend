# Rutas ABM — Full Specification

## Purpose

Define the complete behavioral contract for the Rutas (rutas-pasadas) frontend feature:
API types, list page, full-page create/edit form, MSW test handlers, and test coverage.
This is a new spec (no prior spec file exists for this domain).

---

## Requirements

### Requirement: API Read and Write Types

The system MUST define separate read and write TypeScript interfaces for route stages in `frontend/src/api/rutas.ts`.

`RutaPasadaEtapa` (read shape) MUST contain: `id` (optional), `orden`, `pesoIdeal`, `pesoMinimo`, `pesoMaximo`, `cantidadMuestrasRequeridas`, `activo`, and `etapa: { id, nombre, descripcion, activo }`. It MUST NOT contain `articulo`.

`RutaPasadaEtapaCreate` (write shape) MUST contain: `etapa: number` (ID only), `orden`, `pesoIdeal`, `pesoMinimo`, `pesoMaximo`, `cantidadMuestrasRequeridas`. It MUST NOT contain `articulo`.

`Ruta` MUST include `etapas?: RutaPasadaEtapa[]`. `RutaCreate` and `RutaPasadaUpdate` MUST use `etapas: RutaPasadaEtapaCreate[]`.

#### Scenario: Type contract enforced at compile time

- GIVEN `frontend/src/api/rutas.ts` is updated with the new interfaces
- WHEN TypeScript compilation runs (`tsc --noEmit`)
- THEN no errors are emitted
- AND no file in `frontend/src/` references `articulo` on a ruta-stage type

#### Scenario: Write payload omits articulo and includes orden

- GIVEN a `RutaPasadaEtapaCreate` object is constructed from form values
- WHEN it is serialized as the POST/PUT body
- THEN the payload contains `etapa` as a number, `orden` as a positive integer
- AND the payload does NOT contain an `articulo` key

---

### Requirement: RutasPage List Behavior

`RutasPage` MUST render as a read-only list with two partitions (active / inactive) and MUST NOT contain inline create/edit modals.

The active partition MUST display rutas where `activo === true`. The inactive partition MUST display rutas where `activo === false`.

Search/filter input MUST filter the visible partition by `nombre` (case-insensitive substring match).

#### Scenario: Active rutas render in active partition

- GIVEN the component mounts and the server returns active rutas
- WHEN the active tab is selected (default)
- THEN each active ruta's `nombre` is visible in the list
- AND inactive rutas are not visible

#### Scenario: Inactive rutas render in inactive partition

- GIVEN the component mounts with mixed mock data
- WHEN the user switches to the inactive partition
- THEN each inactive ruta's `nombre` is visible
- AND active rutas are not visible

#### Scenario: Search filters by nombre

- GIVEN the active partition is displayed with multiple rutas
- WHEN the user types a substring matching one ruta's nombre
- THEN only matching rutas remain visible

#### Scenario: Navigate to create form

- GIVEN `RutasPage` is rendered with a mocked `useNavigate`
- WHEN the user clicks the "Nueva Ruta" button
- THEN `navigate` is called with `/dashboard/rutas/new`

#### Scenario: Navigate to edit form

- GIVEN a ruta row is rendered
- WHEN the user clicks the edit icon for that row
- THEN `navigate` is called with `/dashboard/rutas/:id` where `:id` matches the ruta

#### Scenario: Activate ruta

- GIVEN a ruta with `activo: false` is visible
- WHEN the user clicks the activate action for that row
- THEN a PUT request is made to `/api/rutas-pasadas/:id` with body `{ activo: true }`
- AND the ruta list is invalidated/refetched

#### Scenario: Delete ruta with confirmation

- GIVEN a ruta row is visible
- WHEN the user clicks the delete action and confirms the dialog
- THEN a DELETE request is made to `/api/rutas-pasadas/:id`
- AND the ruta list is invalidated/refetched

#### Scenario: Delete cancelled by user

- GIVEN a ruta row is visible
- WHEN the user clicks the delete action and dismisses the confirm dialog
- THEN no DELETE request is made

---

### Requirement: RutaFormPage Create

`RutaFormPage` MUST be accessible at `/dashboard/rutas/new` and MUST render a form for creating a new ruta with a nested etapas sub-form.

Fields `nombre` (required, non-empty string) and `descripcion` (optional string) MUST be present at the ruta level.

The etapas sub-form MUST require at least one etapa row before submission is allowed.

Each etapa row MUST contain: etapa picker (populated from GET `/api/etapas`, active entries only), `pesoMinimo`, `pesoIdeal`, `pesoMaximo`, `cantidadMuestrasRequeridas`. All are required. `pesoMinimo`, `pesoIdeal`, `pesoMaximo` MUST be numbers > 0. `cantidadMuestrasRequeridas` MUST be an integer ≥ 1.

`orden` MUST be derived from the row's 1-based array index and MUST NOT be a visible input.

#### Scenario: Render empty create form

- GIVEN the user navigates to `/dashboard/rutas/new`
- WHEN `RutaFormPage` mounts
- THEN an empty form is shown with one default etapa row
- AND the etapa picker is populated from the GET `/api/etapas` response

#### Scenario: Add etapa row

- GIVEN the form is rendered with one etapa row
- WHEN the user clicks "Agregar Etapa"
- THEN a new empty etapa row is appended
- AND the total row count increases by one

#### Scenario: Remove etapa row (multiple rows present)

- GIVEN the form has two or more etapa rows
- WHEN the user clicks the remove button on a row
- THEN that row is removed
- AND the remaining rows are renumbered

#### Scenario: Remove button disabled with one row

- GIVEN the form has exactly one etapa row
- WHEN the remove button is rendered
- THEN the remove button is disabled

#### Scenario: Reorder rows with up/down buttons

- GIVEN the form has at least two etapa rows
- WHEN the user clicks the up button on the second row
- THEN the second row swaps position with the first row

#### Scenario: Submit creates ruta

- GIVEN valid nombre and at least one complete etapa row
- WHEN the user submits the form
- THEN a POST request is made to `/api/rutas-pasadas` with `etapas` array using write shape (`etapa: number`, `orden: index + 1`, no `articulo`)
- AND on success, `navigate` is called with `/dashboard/rutas`

#### Scenario: Validation errors block submit

- GIVEN nombre is empty or an etapa row has a missing required field
- WHEN the user attempts to submit
- THEN inline validation errors are shown
- AND no POST request is made

---

### Requirement: RutaFormPage Edit

`RutaFormPage` MUST be accessible at `/dashboard/rutas/:id` and MUST pre-fill all fields from the existing ruta, including its etapas array.

#### Scenario: Pre-fill fields from existing ruta

- GIVEN the user navigates to `/dashboard/rutas/:id` for an existing ruta
- WHEN `RutaFormPage` mounts and GET `/api/rutas-pasadas/:id` returns the ruta
- THEN `nombre` and `descripcion` are pre-filled
- AND each etapa row is pre-filled with the read-shape data (etapa picker shows the correct etapa, all peso fields populated)

#### Scenario: Submit updates ruta

- GIVEN the edit form is pre-filled and the user modifies a field
- WHEN the user submits the form
- THEN a PUT request is made to `/api/rutas-pasadas/:id` with the updated payload in write shape
- AND existing etapa rows include their `id` field in the payload
- AND on success, `navigate` is called with `/dashboard/rutas`

---

### Requirement: MSW Test Handlers

The MSW handler file (`frontend/src/test/handlers.ts`) MUST provide sufficient mock data and route handlers for all Rutas test scenarios.

`rutasMock` entries MUST include a non-empty `etapas` array in the read shape. At least `rutasMock[0]` and one inactive entry MUST have populated `etapas` referencing entries from `etapasMock`.

A GET handler for `/api/rutas-pasadas/:id` MUST exist, searching both active and inactive mock arrays and returning the matching entry (with etapas) wrapped in `{ success: true, data: ... }`. If no match is found, it MUST return 404.

A GET handler for `/api/etapas` MUST exist and return the `etapasMock` list (active entries).

Existing POST, PUT, and DELETE handlers MUST be preserved.

#### Scenario: GET by id returns ruta with etapas

- GIVEN a ruta with id matching a `rutasMock` entry
- WHEN GET `/api/rutas-pasadas/:id` is called in tests
- THEN the response contains the ruta's `etapas` array in read shape

#### Scenario: GET by id returns 404 for unknown id

- GIVEN an id that does not match any mock entry
- WHEN GET `/api/rutas-pasadas/:id` is called
- THEN the handler returns HTTP 404

#### Scenario: Etapas picker populated from GET /api/etapas

- GIVEN `RutaFormPage` mounts in test environment
- WHEN the etapa picker is rendered
- THEN it shows the etapa names from `etapasMock`

---

### Requirement: Test Coverage — RutasPage

`RutasPage.test.tsx` MUST be rewritten to test the navigate-based pattern. It MUST NOT assert on modal headings, modal buttons, or in-page form elements. `useNavigate` MUST be mocked.

The test file MUST cover: renders active list, renders inactive list, search filter, navigate to create, navigate to edit, activate PUT, delete with confirm, delete cancelled.

#### Scenario: Mock navigate is called on create

- GIVEN `useNavigate` is mocked to return a spy function
- WHEN the user clicks "Nueva Ruta"
- THEN the spy is called with `/dashboard/rutas/new`

#### Scenario: Mock navigate is called on edit

- GIVEN `useNavigate` is mocked and a ruta row is rendered
- WHEN the user clicks the edit icon
- THEN the spy is called with the correct route path including the ruta id

---

### Requirement: Test Coverage — RutaFormPage

`RutaFormPage.test.tsx` MUST provide component-level behavioral tests. Schema-only unit tests that reference `articulo` MUST be removed or updated.

The test file MUST cover: renders empty form, add row, remove row (multiple rows), remove disabled (one row), reorder rows, submit creates ruta with correct payload, edit pre-fills etapas, submit updates ruta with id in payload, validation errors block submit.

#### Scenario: Submit payload has no articulo and has orden

- GIVEN the form is filled with valid data and one etapa row
- WHEN the form is submitted
- THEN the intercepted POST body contains `etapa` as a number and `orden: 1`
- AND the body does NOT contain an `articulo` key

#### Scenario: Edit pre-fill maps read shape to form

- GIVEN GET `/api/rutas-pasadas/:id` returns a ruta with etapas in read shape
- WHEN the form mounts in edit mode
- THEN each etapa row's picker shows the correct etapa
- AND all peso fields match the mock values
