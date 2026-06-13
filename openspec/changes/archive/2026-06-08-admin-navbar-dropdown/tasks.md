# Tasks: Admin Navbar Dropdown

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~50-80 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Not needed |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Complete navbar dropdown refactor | PR 1 | Single PR containing logic and test updates |

## Phase 1: Core Implementation

- [x] 1.1 `frontend/src/layouts/DashboardLayout.tsx`: Add local `useState` for `isGestionOpen`, lazily initializing to `true` if `useLocation().pathname` matches any management route (`/articulos`, `/etapas`, `/lineas`, `/rutas`, `/usuarios`).
- [x] 1.2 `frontend/src/layouts/DashboardLayout.tsx`: Flatten single-option menu sections. Replace "En vivo" with direct link "Monitoreo", "Operación" with "Planta", and "Informes" with "Reportes".
- [x] 1.3 `frontend/src/layouts/DashboardLayout.tsx`: Convert the "Gestión" section into a clickable toggle button and conditionally render its child links based on `isGestionOpen`.

## Phase 2: Testing

- [x] 2.1 `frontend/src/layouts/DashboardLayout.test.tsx`: Update existing tests to query for the new direct links "Monitoreo", "Planta", and "Reportes" matching their respective roles.
- [x] 2.2 `frontend/src/layouts/DashboardLayout.test.tsx`: Write test to verify "Gestión" links are hidden by default on `/dashboard` and visible when navigating to `/dashboard/articulos`.
- [x] 2.3 `frontend/src/layouts/DashboardLayout.test.tsx`: Write test to verify clicking the "Gestión" toggle properly shows and hides its children.
