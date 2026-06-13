# Design: Admin Navbar Dropdown

## Technical Approach

Introduce a local state in `DashboardLayout` to manage the "Gestión" section's collapse/expand state, defaulting to open when the current route matches its sub-items. We will flatten the other menu sections (Monitoreo, Planta, Reportes) by removing their section headers and renaming them as direct links to save vertical space and align with domain terminology.

## Architecture Decisions

### Decision: State Location for Dropdown

**Choice**: Local `useState` inside `DashboardLayout.tsx`.
**Alternatives considered**: Global state (Context/Zustand), URL search params.
**Rationale**: The toggle state is purely presentational and localized to the sidebar. It doesn't need to be shared across the app, making local state the simplest and most appropriate choice.

### Decision: Dropdown Initialization

**Choice**: Initialize `useState` lazily checking `useLocation().pathname`.
**Alternatives considered**: Always open, always closed, or using a `useEffect` to sync state on every route change.
**Rationale**: Initializing it based on the pathname ensures that on refresh or direct navigation to a Gestión page, the menu is already open without flashing. It avoids unnecessary `useEffect` renders.

## Data Flow

    [Router Location] ───────┐
                             │ (Initial State)
                             ▼
    [User Click] ────→ [isGestionOpen] ────→ [Render "Gestión" Sub-links]

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/layouts/DashboardLayout.tsx` | Modify | Add local state for dropdown, update link names (Monitoreo, Planta, Reportes), convert Gestión to a toggleable section containing its original sub-items. |
| `frontend/src/layouts/DashboardLayout.test.tsx` | Modify | Update queries to match new link names, and add interactions to open the Gestión dropdown (or change initial routes) before asserting the presence of its children. |

## Interfaces / Contracts

No new interfaces. The state is purely internal to the layout:

```tsx
const location = useLocation();
const [isGestionOpen, setIsGestionOpen] = useState(() => {
  return ['/articulos', '/etapas', '/lineas', '/rutas', '/usuarios']
    .some(path => location.pathname.includes(path));
});
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Navigation Links | Verify "Monitoreo", "Planta", and "Reportes" are rendered according to the user's role. |
| Unit | Dropdown Default State | Verify "Gestión" links are hidden on `/dashboard` and visible on `/dashboard/articulos`. |
| Unit | Dropdown Interaction | Verify clicking the "Gestión" toggle shows/hides its children (e.g., Artículos, Usuarios). |

## Migration / Rollout

No migration required. This is a purely frontend presentational change.

## Open Questions

- None
