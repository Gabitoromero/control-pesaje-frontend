## Exploration: responsive-dashboard

### Current State
The `DashboardLayout` currently uses a rigid, non-responsive structural approach based on a fixed `w-64` (16rem / 256px) sidebar and an overflow-hidden full-viewport wrapper (`h-screen w-screen`). The sidebar is forced to never shrink (`flex-shrink-0`), which means on smaller viewports, the UI becomes unusable or gets completely clipped. There are no responsive media breakpoints (`md:`, `lg:`) and no modern layout adaptations for mobile/tablet screens.

### Affected Areas
- `frontend/src/layouts/DashboardLayout.tsx` — The primary container establishing the flex layout and housing the sidebar navigation. Needs refactoring to be fully responsive.
- `frontend/src/features/dashboard/pages/*` (implicitly) — Inner pages may need container queries (`@container`) inside the `<Outlet />` to adjust to their allocated space dynamically, rather than assuming a large desktop viewport.

### Approaches
1. **Viewport Breakpoints + Native Dialog Drawer** — Hide the sidebar on small screens (`max-md:hidden`), add a top-bar with a hamburger menu for mobile/tablet, and use a responsive drawer overlay (potentially using the native HTML `<dialog>` element) to display the navigation when opened.
   - Pros: Standard, familiar mobile UX. Keeps the main content area clean and readable.
   - Cons: Requires managing the open/close state of the mobile sidebar.
   - Effort: Medium

2. **CSS Grid + Size-Aware Container Queries** — Convert the rigid Flexbox wrapper to a CSS Grid layout (`grid-template-columns: auto 1fr`). Define the main `<main>` wrapper as a CSS container (`container-type: inline-size`), allowing the sidebar to collapse into an icon-only state and empowering child components to adjust via `@container` queries based on their actual available space.
   - Pros: Highly modern, modular. Child pages inside the `<Outlet />` can use container queries to adjust table densities and data grids dynamically without relying on the viewport size.
   - Cons: More complex to configure with nested sub-menus (like "Gestión") in an icon-only collapsed state.
   - Effort: High

### Recommendation
**Approach 1 combined with Container Queries for the main content area**. 
Refactoring the `DashboardLayout` to use standard viewport breakpoints for the macro layout (mobile top bar + off-canvas drawer for navigation, persistent sidebar on `md:` screens) provides the best UX for nested navigation. Furthermore, declaring the `<main>` element as an inline-size container (`container-type: inline-size`) sets up future child pages (lists, data grids) to use size-aware styling (per modern web guidance) as they are built.

### Risks
- Moving the navigation into an off-canvas drawer on mobile could make nested menu items (e.g., the "Gestión" sub-menu) harder to interact with if not styled with appropriate touch targets.
- The change in layout structure might affect existing page scrolling behaviors if they rely on the exact `h-screen overflow-auto` mechanics of the current implementation.

### Ready for Proposal
Yes — the orchestrator should tell the user that the layout structure has been analyzed and we are ready to draft the proposal.
