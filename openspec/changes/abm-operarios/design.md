# Design: ABM de Operarios

## Technical Approach

Refactor `UsuariosPage.tsx` into smaller, presentational components to support conditional rendering based on screen size (Tailwind breakpoints). The state (React Query, modal visibility, form data) remains centralized in the page component, passing data and callbacks to the child components. This prevents duplicate API calls and keeps the UI logic DRY.

## Architecture Decisions

### Decision: Conditional Rendering Strategy

**Choice**: Use Tailwind CSS display classes (`hidden lg:table`, `grid lg:hidden`) to toggle between Table and Card views.
**Alternatives considered**: React `window.innerWidth` listeners or `matchMedia` hooks to conditionally render components in JS.
**Rationale**: CSS-based toggling is faster, avoids hydration mismatches, doesn't require extra re-renders on resize, and leverages the existing Tailwind setup seamlessly.

### Decision: State Management

**Choice**: Centralize React Query hooks and Modal state in `UsuariosPage.tsx`.
**Alternatives considered**: Move data fetching to individual components or context.
**Rationale**: The page is the single source of truth for the ABM. Passing `usuarios`, `isLoading`, `onEdit`, and `onDelete` to presentational components (Table and Cards) keeps them pure and testable.

### Decision: Modal Responsiveness

**Choice**: Refactor the inline modal into a separate `UsuarioModal.tsx` component with `max-h-[90vh] overflow-y-auto` and full width on mobile (`w-full sm:max-w-md`).
**Alternatives considered**: Bottom sheet library for mobile.
**Rationale**: Avoid adding new dependencies. Standard Tailwind utilities provide enough flexibility for a safe-area aware, scrollable modal that prevents keyboard clipping.

## Data Flow

    UsuariosPage (React Query state)
         │
         ├──→ UsuariosTable (props: usuarios, onEdit, onDelete) [visible lg+]
         │
         ├──→ UsuariosCards (props: usuarios, onEdit, onDelete) [visible <lg]
         │
         └──→ UsuarioModal (props: isOpen, onClose, onSubmit, initialData)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/features/dashboard/pages/UsuariosPage.tsx` | Modify | Extract UI into subcomponents. Keep React Query hooks and state handlers. Render `<UsuariosTable />`, `<UsuariosCards />`, and `<UsuarioModal />`. |
| `frontend/src/features/dashboard/components/UsuariosTable.tsx` | Create | Desktop/Tablet-landscape view. Contains the native `<table>` with `hidden lg:table`. |
| `frontend/src/features/dashboard/components/UsuariosCards.tsx` | Create | Mobile/Tablet-portrait view. Contains a CSS grid of cards with `grid gap-4 lg:hidden`. |
| `frontend/src/features/dashboard/components/UsuarioModal.tsx` | Create | The form modal. Extracted from the page, styled for full viewport on mobile and scrollable. |

## Interfaces / Contracts

```typescript
// Shared props for list components
interface UsuariosListProps {
  usuarios: Usuario[];
  onEdit: (usuario: Usuario) => void;
  onDelete: (id: number) => void;
}

// In UsuariosTable.tsx and UsuariosCards.tsx:
export const UsuariosTable: React.FC<UsuariosListProps> = ({ usuarios, onEdit, onDelete }) => { ... }
export const UsuariosCards: React.FC<UsuariosListProps> = ({ usuarios, onEdit, onDelete }) => { ... }
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Presentational components | Test `UsuariosTable` and `UsuariosCards` render the correct data and trigger `onEdit`/`onDelete` callbacks when buttons are clicked. |
| Integration | `UsuariosPage` | Test that the modal opens with the correct state when "Nuevo Usuario" or "Editar" is clicked, and that mutations are called correctly. |

## Migration / Rollout

No migration required. Pure frontend visual refactor.

## Open Questions

- None
