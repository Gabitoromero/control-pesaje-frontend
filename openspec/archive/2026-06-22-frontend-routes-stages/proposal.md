# Proposal: Frontend Routes and Stages Management

## Intent
Migrate the `RutasPasadas` ABM in the frontend from a simple modal to a dedicated page to support the new backend capabilities. The dedicated page will allow users to configure the route's details along with a nested, ordered list of stages and their specific weight parameters.

## Scope

### In Scope
- Create a new dedicated page for Route creation and editing (`/rutas/new`, `/rutas/:id`).
- Implement a dynamic form for adding, removing, and reordering stages (`etapas`).
- Integrate with `api/rutas.ts` to send the nested payload.
- Update `RutasPage` to redirect to the dedicated pages instead of opening a modal.

### Out of Scope
- Backend modifications (already completed).

## Capabilities
### Modified Capabilities
- `frontend-routes-management`: Now uses dedicated pages and supports nested stages.

## Approach
Implement a dedicated page builder. We will use a dynamic form approach to manage the `etapas` array. We will use UI elements for reordering stages. Lookups for Articles and Stages will be done via existing frontend API hooks.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/features/dashboard/pages/RutasPage.tsx` | Modified | Change modal to routing. |
| `frontend/src/features/dashboard/pages/RutaFormPage.tsx` (or similar) | New | Dedicated builder page. |
| `frontend/src/api/rutas.ts` | Modified | Update interfaces and payloads to match the backend. |
| `frontend/src/router` or `App.tsx` | Modified | Add new routes. |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Form state complexity | Low | Use standard robust state management / form libraries. |

## Rollback Plan
Revert the frontend git commits associated with this change.

## Dependencies
- Backend routes-stages support (completed).

## Success Criteria
- [ ] Users can navigate to a dedicated page to create or edit a route.
- [ ] Users can add multiple stages, setting weights and order for each.
- [ ] The full nested payload successfully saves in the backend.
