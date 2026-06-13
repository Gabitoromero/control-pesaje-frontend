## Exploration: admin-navbar-dropdown

### Current State
Currently, `DashboardLayout.tsx` defines the lateral navbar using a static column of navigation links inside a `<nav>` tag. The sections (Monitoreo, Planta, Gestión, Reportes) are differentiated visually by text headers (`<div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Gestión</div>`). The links under "Gestión" (Artículos, Etapas, Líneas, Rutas, Usuarios) are always visible to the `jefe` and `administrador` roles, taking up significant vertical space.

### Affected Areas
- `frontend/src/layouts/DashboardLayout.tsx` — This file contains the hardcoded sidebar structure and handles role-based rendering of the menu items. We need to introduce state or an HTML `<details>` structure here to support a collapsible menu for "Gestión".

### Approaches
1. **React State-Driven Collapse (Recommended)**
   - Create a local state (`isGestionOpen`) via `useState` to track the collapse state.
   - Initialize it based on the current route (`useLocation().pathname`) so it stays open when navigating inside "Gestión".
   - Use `ChevronDown` / `ChevronRight` from `lucide-react` to indicate state.
   - Pros: Smooth control, easy to style, integrates perfectly with React Router's active states.
   - Cons: Slightly more verbose than native HTML elements.
   - Effort: Low

2. **Native HTML `<details>` and `<summary>`**
   - Wrap the "Gestión" group in a `<details>` element, with the "Gestión" header as the `<summary>`.
   - Pros: No React state required; native browser accessibility for accordion behavior.
   - Cons: Harder to animate smoothly; styling the `<summary>` marker and handling default open state based on current route can be cumbersome across different browsers.
   - Effort: Low

### Recommendation
**Approach 1 (React State-Driven Collapse)** is recommended. Since we are using TailwindCSS and React Router, a state-driven approach lets us easily read `useLocation()` to keep the dropdown open if the user is on any of the sub-pages (e.g., `/dashboard/articulos`). We can style a clickable header component mimicking the existing `NavLink` styles but toggling the `isGestionOpen` state.

### Risks
- Users currently on a Gestión route might see the menu snap shut if we don't properly initialize the state based on the current URL path.
- The sidebar layout is `flex-shrink-0` with `overflow-hidden`. A smooth transition might require adding `overflow-hidden` or `grid-template-rows` hacks to animate cleanly, though a simple immediate toggle is robust and zero-risk.

### Ready for Proposal
Yes. You can instruct the `sdd-propose` phase to detail the exact React state changes and Tailwind classes for the new collapsible "Gestión" menu in `DashboardLayout.tsx`.
