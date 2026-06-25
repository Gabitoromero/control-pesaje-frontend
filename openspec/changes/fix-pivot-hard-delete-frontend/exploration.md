## Exploration: frontend update for fix-pivot-hard-delete

### Current State
The backend removed the `activo` field from the pivot tables (`RutaPasadaEtapa` and `ArticuloRutaPasada`) and transitioned them to use hard delete. The route stages administration (`RutaFormPage`) works by submitting a unified payload (a list of stages) to the parent route update endpoint (`PUT /api/rutas-pasadas/:id`).
- When a user deletes a stage from a route in the form, it is removed from the local state list.
- When saving, the frontend submits the updated (remaining) stages to the parent route endpoint.
- The backend compare-and-match logic identifies that the stage is missing from the request payload and transactionally *hard deletes* the omitted `RutaPasadaEtapa` pivot record from the database.
- The frontend does not call `/api/rutas-pasadas-etapas` directly and does not have references to the deleted `/inactive` or `PUT /:id` stages endpoints.

### Affected Areas
- `frontend/src/shared/types/domain.ts` — Already aligned: does not contain the `activo?: boolean` property on the pivot model representation (`RutaPasadaEtapa`).
- `frontend/src/features/dashboard/pages/RutaFormPage.tsx` — Behaves correctly. Stage removal is managed on the form state and sent transactionally to the parent update endpoint, which triggers transactional hard deletes.
- `frontend/src/api/rutas.ts` — Behaves correctly. It correctly submits Route payloads (including their stages) to `/rutas-pasadas`.

### Approaches
1. **Maintain Current Transactional Update Model (Recommended)** — Continue submitting route stages collectively inside the route edit form to `PUT /api/rutas-pasadas/:id`.
   - Pros: Transactional consistency, users can cancel changes, no orphan stages, aligns perfectly with existing backend implementation.
   - Cons: None.
   - Effort: Low

2. **Migrate to Direct Endpoint Deletion** — Make immediate DELETE requests to `DELETE /api/rutas-pasadas-etapas/:id` when a stage is removed from the form.
   - Pros: Follows RESTful endpoints for individual pivots.
   - Cons: Destroys form transactional integrity (cannot cancel edits), introduces state synchronization complexity, high risk of inconsistent routes.
   - Effort: High

### Recommendation
Maintain **Approach 1 (Transactional Update)**. Route and stages management is naturally a master-detail form, and keeping updates transactional ensures the route remains in a valid state. The backend update service is already built to handle additions, updates, and hard deletions of stage pivots in a single database transaction.

### Risks
- No significant risks identified, as frontend typings and API payloads are already aligned with the backend's hard delete logic.

### Ready for Proposal
Yes — The orchestrator should proceed to the proposal/design phase as no changes are needed on the frontend since the current implementation is already fully compliant with the backend's hard delete pivot behavior.
