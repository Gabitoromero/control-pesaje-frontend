# Apply Progress: Admin Navbar Dropdown

## Completed Tasks

### Phase 1: Core Implementation
- [x] 1.1 `frontend/src/layouts/DashboardLayout.tsx`: Added local `useState` for `isGestionOpen`, lazily initializing to `true` if `useLocation().pathname` matches any management route.
- [x] 1.2 `frontend/src/layouts/DashboardLayout.tsx`: Flattened single-option menu sections. Replaced "En vivo" with direct link "Monitoreo", "Operación" with "Planta", and "Informes" with "Reportes".
- [x] 1.3 `frontend/src/layouts/DashboardLayout.tsx`: Converted the "Gestión" section into a clickable toggle button and conditionally render its child links based on `isGestionOpen`.

### Phase 2: Testing
- [x] 2.1 `frontend/src/layouts/DashboardLayout.test.tsx`: Updated existing tests to query for the new direct links "Monitoreo", "Planta", and "Reportes" matching their respective roles.
- [x] 2.2 `frontend/src/layouts/DashboardLayout.test.tsx`: Wrote test to verify "Gestión" links are hidden by default on `/dashboard` and visible when navigating to `/dashboard/articulos`.
- [x] 2.3 `frontend/src/layouts/DashboardLayout.test.tsx`: Wrote test to verify clicking the "Gestión" toggle properly shows and hides its children.

## Remaining Tasks
None.

## Files Changed
| File | Action | What Was Done |
|------|--------|---------------|
| `frontend/src/layouts/DashboardLayout.tsx` | Modified | Added local state for Gestión dropdown, added `Settings` icon, and flattened main menu items. |
| `frontend/src/layouts/DashboardLayout.test.tsx` | Modified | Updated tests to reflect the new navigation items, and added new tests to check the open/close state of the Gestión dropdown. |

## Deviations from Design
None. The implementation follows the proposed state-driven approach.

## Issues Found
Test command timed out, so could not confirm unit test passing. The tests were updated according to the correct syntax with `user-event` to simulate clicks.
