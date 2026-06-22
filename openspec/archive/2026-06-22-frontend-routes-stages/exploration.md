# Exploration: Frontend Routes and Stages Management

## Current State
Currently, the `RutasPage` in the frontend allows users to create and edit a `Ruta` (Route) via a simple modal containing only the `nombre` and `descripcion` fields. However, the backend architecture was recently updated to support full transactional CRUD for `RutaPasada`, where a route is a composition of `RutaPasadaEtapa` objects. Each stage link in the backend (`RutaPasadaEtapaCreateSchema`) requires several fields to be configured:
- `articulo` (Article ID)
- `etapa` (Stage ID)
- `orden` (Order in the sequence)
- `pesoIdeal`, `pesoMinimo`, `pesoMaximo` (Weight bounds)
- `cantidadMuestrasRequeridas` (Required samples)

The frontend currently does not send this `etapas` array when creating or updating a `Ruta`, and the UI has no way to input these parameters. The types in `/frontend/src/api/rutas.ts` (`Ruta` and `RutaCreate`) lack the `etapas` property.

## Affected Areas
- `/frontend/src/api/rutas.ts` — The `Ruta` and `RutaCreate` interfaces need to be updated to include the `etapas` array matching the backend schema.
- `/frontend/src/features/dashboard/pages/RutasPage.tsx` — The UI must be modified to allow adding, editing, reordering, and deleting stages within a route form.
- `/frontend/src/api/articulos.ts` & `/frontend/src/api/etapas.ts` — Will be needed by the route form to fetch the available articles and stages for the dropdown selectors.

## Approaches

### 1. Expanded Modal with Dynamic List (Nested Form)
Expand the existing `RutasPage` modal to include a dynamic list of stages. Users can click "Add Stage" to append a new row or sub-form within the modal. Each row would contain selectors for Article and Stage, along with number inputs for the weight bounds.
- **Pros:** Keeps the user on the same page, preserving the current SPA feel.
- **Cons:** The modal could become very cluttered and require vertical scrolling, leading to a poor UX on smaller screens given the number of fields required per stage.

### 2. Full Page Dedicated Route Builder
Migrate the route creation/editing from a modal to dedicated routes (e.g., `/rutas/new` and `/rutas/:id/edit`). This dedicated page would provide ample space for a master-detail view or a drag-and-drop list for the sequence of stages.
- **Pros:** Cleanest UX for complex forms. Plenty of horizontal and vertical space for the weight configuration matrix.
- **Cons:** Requires adding new routes to the router and refactoring the current modal-based list view.

### 3. Drawer / Side Panel
Replace the centered modal with a sliding right-side drawer. The drawer provides full vertical height for the form, allowing a collapsible or accordion-style list of stages.
- **Pros:** Better than a modal for long forms, but keeps the user in the context of the list view.
- **Cons:** May still feel cramped horizontally for 7 inputs per stage.

## Recommendation
**Approach 2 (Full Page Dedicated Route Builder)** is recommended.
Given that each `RutaPasadaEtapa` requires selecting an Article, a Stage, an Order, three weight parameters, and a sample count, trying to fit a dynamic list of these into a standard modal will result in a cramped and frustrating user experience. A dedicated page provides the necessary real estate to use a proper data grid or a drag-and-drop builder interface for constructing the route's stages.
