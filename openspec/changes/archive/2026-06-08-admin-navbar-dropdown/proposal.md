# Proposal: Admin Navbar Dropdown

## Intent

Improve the lateral navbar user experience by saving vertical space and clarifying domain terminology. We are removing single-option menu sections in favor of direct buttons and converting the "Gestión" section into a state-driven collapsible dropdown.

## Scope

### In Scope
- Convert single-option sections into direct buttons.
- Rename the direct buttons to match domain terms:
  - "En vivo" -> "Monitoreo"
  - "Operación" -> "Planta"
  - "Informes" -> "Reportes"
- Implement a state-driven React collapsible dropdown for the "Gestión" group (Artículos, Etapas, Líneas, Rutas, Usuarios).
- Auto-expand the "Gestión" dropdown if the current route matches any of its sub-items.

### Out of Scope
- Adding new routes or pages.
- Complex or heavy sidebar animations (we will rely on a simple immediate toggle).
- Changes to backend or routing paths (labels change, underlying paths remain the same).

## Capabilities

### New Capabilities
None

### Modified Capabilities
None

## Approach

Use the recommended React State-Driven Collapse approach:
1. Introduce a local `useState` hook (`isGestionOpen`) in `DashboardLayout.tsx`.
2. Initialize the state by checking if `useLocation().pathname` includes `/dashboard/articulos`, `/dashboard/etapas`, `/dashboard/lineas`, `/dashboard/rutas`, or `/dashboard/usuarios`.
3. Render "Monitoreo", "Planta", and "Reportes" as flat navigation links (buttons), removing their section headers.
4. Render the "Gestión" header as a clickable toggle to flip `isGestionOpen`, using a `ChevronDown` / `ChevronRight` icon to indicate its state.
5. Conditionally render the "Gestión" child links based on `isGestionOpen`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/layouts/DashboardLayout.tsx` | Modified | Navbar structure logic, routing labels, and local state. |
| `frontend/src/layouts/DashboardLayout.test.tsx` | Modified | Update tests to reflect new button names and test the toggling logic. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Menu snapping shut incorrectly on reload | Low | Initialize state correctly using React Router's `useLocation()` to keep it open on relevant routes. |
| Test failures due to label changes | High | Update the corresponding assertions in `DashboardLayout.test.tsx` for the new labels (Monitoreo, Planta, Reportes) and the dropdown state. |

## Rollback Plan

Revert the git commits affecting `DashboardLayout.tsx` and `DashboardLayout.test.tsx` to restore the previous static menu implementation.

## Dependencies

- React Router (`useLocation`)
- Lucide React (for chevron icons)

## Success Criteria

- [ ] "En vivo" is renamed to "Monitoreo" without a section header.
- [ ] "Operación" is renamed to "Planta" without a section header.
- [ ] "Informes" is renamed to "Reportes" without a section header.
- [ ] "Gestión" is a clickable dropdown containing Artículos, Etapas, Líneas, Rutas, Usuarios.
- [ ] Navigating to a "Gestión" sub-item keeps the dropdown open on refresh.
