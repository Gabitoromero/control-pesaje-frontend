# Proposal: Capa 2 Stepper UX

## Intent

Improve the UX of the Layer 2 (Line) session activation process by introducing a clear, two-step visual indicator. This helps the user understand their progress during authentication (Legajo -> PIN).

## Scope

### In Scope
- Build an inline Stepper Component inside `ActivarSesionPage.tsx`.
- Use Tailwind CSS for layout and styling.
- Use `lucide-react` icons (User for Legajo, Lock for PIN).
- Implement CSS transitions for active states and the connecting line.

### Out of Scope
- Adding new heavy animation libraries (e.g., Framer Motion).
- Changing backend authentication logic.
- Modifying other pages or flows.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `session-management`: Update the UX flow for the Layer 2 session activation in `ActivarSesionPage.tsx` to include a visual stepper.

## Approach

Build a custom, inline Stepper component directly in `ActivarSesionPage.tsx` using Tailwind CSS and `lucide-react` icons. The stepper will visually map the authentication sequence (Step 1: Legajo input, Step 2: PIN input), using pure CSS transitions for active/inactive state changes and the connecting line to avoid heavy external dependencies.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/features/tablet/pages/ActivarSesionPage.tsx` | Modified | Adds the inline Stepper component and integrates it with the step state. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| CSS transitions behave inconsistently across browsers | Low | Stick to standard Tailwind transition utilities (`transition-colors`, `transition-all`). |
| Stepper misaligns with existing mobile/tablet layout | Low | Test responsiveness using standard Tailwind breakpoints. |

## Rollback Plan

Revert the commit modifying `ActivarSesionPage.tsx` to restore the previous UI state without the stepper component.

## Dependencies

- `lucide-react` (already present, to be verified)
- `tailwindcss` (already configured)

## Success Criteria

- [ ] A two-step visual stepper is visible on the `ActivarSesionPage`.
- [ ] Step 1 uses a User icon, Step 2 uses a Lock icon.
- [ ] Transition between steps is smooth using CSS transitions.
- [ ] No new third-party animation libraries are added to `package.json`.
