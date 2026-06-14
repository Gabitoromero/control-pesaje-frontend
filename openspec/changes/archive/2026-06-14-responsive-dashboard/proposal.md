# Proposal: Responsive Dashboard

## Intent

Make the dashboard fully responsive across devices. This change replaces rigid flex layouts with a modern, modular architecture, enabling a better mobile and tablet experience and setting the foundation for size-aware components.

## Scope

### In Scope
- Implement responsive drawer for navigation using the native HTML `<dialog>` element for mobile/tablet screens.
- Implement a top bar with a hamburger menu for mobile/tablet screens.
- Persist the sidebar navigation on desktop screens (e.g., using `md:` breakpoints).
- Refactor the dashboard macro-layout wrapper to use CSS Grid instead of rigid Flexbox.
- Configure the main content area (`<main>`) as a CSS container (`container-type: inline-size`).

### Out of Scope
- Refactoring internal content components (like data grids or specific widgets) to use container queries. This is foundational; components will adopt it iteratively.
- Changes to any backend APIs or data fetching logic.

## Capabilities

### New Capabilities
- `responsive-layout`: Macro layout architecture supporting mobile, tablet, and desktop views with a `<dialog>` drawer and container-query foundations.

### Modified Capabilities
- None

## Approach

The implementation will use Viewport Breakpoints combined with Container Queries. For the macro layout, the `DashboardLayout` will use standard breakpoints to switch between a mobile top bar (with an off-canvas native `<dialog>` navigation drawer) and a persistent desktop sidebar. The layout root will transition from Flexbox to CSS Grid for better structural control. Furthermore, the main content `<main>` element will be declared as `container-type: inline-size`. This enables size-aware styling for future child components, allowing them to adapt to available space rather than raw viewport width, per modern web guidance.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `DashboardLayout` component | Modified | Converted to CSS Grid; integrates mobile top bar and `<dialog>` drawer. |
| `Sidebar` component | Modified | Adapted to be rendered inside the `<dialog>` or persistently on desktop. |
| Global layout styles | Modified | Adding container query types to `<main>`. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Browser compatibility with Container Queries | Low | Container queries are Baseline Widely Available (since Feb 2023). Fallback vertical layouts can be used if strictly needed. |
| Top-layer issues with `<dialog>` drawer | Low | Native `<dialog>` handles top-layer stacking automatically. Avoid manually applying overriding `z-index` to the modal. |

## Rollback Plan

Revert the commits modifying `DashboardLayout`, `Sidebar`, and the associated CSS. Since this change is strictly frontend presentation, no data or backend rollback is necessary.

## Dependencies

- None (using modern native web platform features).

## Success Criteria

- [ ] On mobile/tablet screens, the sidebar is hidden and a top bar with a hamburger menu is visible.
- [ ] Clicking the hamburger menu successfully opens the navigation within a native `<dialog>` drawer.
- [ ] On desktop screens, the sidebar is persistently visible.
- [ ] The `<main>` wrapper correctly has `container-type: inline-size` applied.
- [ ] The layout adapts smoothly to browser resizing without horizontal scrolling or overlap.
