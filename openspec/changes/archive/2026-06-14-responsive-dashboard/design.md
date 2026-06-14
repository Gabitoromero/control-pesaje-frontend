# Design: Responsive Dashboard

## Technical Approach

Refactor the rigid Flexbox dashboard shell into a modern CSS Grid macro-layout. Extract the navigation into a standalone `Sidebar` component. Use a native `<dialog>` element for the mobile drawer navigation, avoiding complex `z-index` management. Apply `container-type: inline-size` to the `<main>` tag to establish a responsive foundation for future size-aware child widgets, per modern web guidance.

## Architecture Decisions

### Decision: Layout Structure

**Choice**: CSS Grid with viewport breakpoints (`grid-cols-1 md:grid-cols-[16rem_1fr]`).
**Alternatives considered**: Flexbox with conditional rendering or hidden sections.
**Rationale**: CSS Grid provides better two-dimensional structural control for a fixed sidebar/header layout than Flexbox, making it trivial to switch from a stacked mobile view (header + content) to a side-by-side desktop view.

### Decision: Mobile Navigation Drawer

**Choice**: Native HTML `<dialog>` element.
**Alternatives considered**: Custom `div` overlay with fixed positioning and high `z-index`.
**Rationale**: `<dialog>` handles top-layer stacking automatically without `z-index` wars, provides native backdrop support, and handles focus trapping efficiently. It is Baseline Widely Available and conforms to modern web guidance.

### Decision: Component Sizing Context

**Choice**: CSS Container Queries (`container-type: inline-size` on `<main>`).
**Alternatives considered**: Standard viewport media queries (`@media`) inside child components.
**Rationale**: Container queries allow widgets to adapt to their actual available space rather than the full viewport width. This makes them truly reusable regardless of whether the sidebar is open, closed, or if they are placed in a multi-column grid layout.

## Data Flow

    User (Mobile) ──→ Taps Hamburger Menu
         │
         └─→ dialogRef.current?.showModal() ───→ `<dialog>` Drawer opens
         │                                            │
         └─→ Taps Nav Link / Backdrop ────────────────┘ (Closes)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/ui/Sidebar.tsx` | Create | Extract the existing inline sidebar logic (navigation, user info, logout) into a reusable component. |
| `src/layouts/DashboardLayout.tsx` | Modify | Convert root container to CSS Grid. Add mobile top header. Implement `<dialog>` drawer. Apply `container-type: inline-size` to `<main>`. |

## Interfaces / Contracts

```tsx
// src/components/ui/Sidebar.tsx
export interface SidebarProps {
  // Optional callback to close the dialog drawer on mobile when a link is clicked
  onNavClick?: () => void;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Sidebar rendering | Verify `Sidebar` component renders navigation links based on user role and auth contexts. |
| Integration | Dialog interactions | Verify clicking the mobile hamburger opens the `<dialog>`, and clicking a link closes it. |
| E2E | Layout integrity | Validate grid tracks at mobile (1 column) and desktop (2 columns) breakpoints. |

## Migration / Rollout

No migration required. This is a pure UI/presentation refactor.

## Open Questions

- None
