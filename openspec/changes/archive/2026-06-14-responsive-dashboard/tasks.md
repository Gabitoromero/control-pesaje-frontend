# Tasks: Responsive Dashboard

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 150-250 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Responsive layout architecture | PR 1 | Base branch; tests included |

## Phase 1: Foundation / Component Extraction

- [x] 1.1 Create `src/components/ui/Sidebar.tsx` by extracting the navigation, user info, and logout logic from `DashboardLayout`.
- [x] 1.2 Add an `onNavClick?: () => void` prop to `SidebarProps` and wire it to all navigation links.

## Phase 2: Core Implementation

- [x] 2.1 Update `src/layouts/DashboardLayout.tsx` root container to use CSS Grid (e.g., `grid-cols-1 md:grid-cols-[16rem_1fr]`).
- [x] 2.2 In `DashboardLayout`, implement a mobile top bar containing a hamburger menu (hidden on desktop).
- [x] 2.3 Add `container-type: inline-size` to the `<main>` content area in `DashboardLayout`.

## Phase 3: Integration / Wiring

- [x] 3.1 Implement the native HTML `<dialog>` element in `DashboardLayout` to wrap the mobile `Sidebar`.
- [x] 3.2 Add a ref and event handlers to open the `<dialog>` (`showModal()`) when the hamburger menu is clicked.
- [x] 3.3 Pass a close handler to `Sidebar`'s `onNavClick` to close the dialog when a navigation link is tapped.

## Phase 4: Testing

- [x] 4.1 Update or create unit tests for `Sidebar.tsx` verifying navigation links and callback execution.
- [x] 4.2 Write integration tests for `DashboardLayout.tsx` verifying the mobile drawer opens/closes and the desktop layout persists the sidebar.
