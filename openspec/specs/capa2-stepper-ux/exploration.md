## Exploration: capa2-stepper-ux

### Current State
In `ActivarSesionPage.tsx`, the Layer 2 session activation flow handles two steps: `legajo` and `pin`. Currently, the distinction is managed by a simple `useState<Step>('legajo')`. The UI reflects the active step by changing a text label ("Ingresá tu legajo" vs "Ingresá tu PIN") and the main action button ("Continuar" vs "Activar sesión"). The input display and the keypad swap between updating the `legajo` and `pin` state strings. There is no clear visual progress indicator or smooth transition between the two steps.

### Affected Areas
- `frontend/src/features/tablet/pages/ActivarSesionPage.tsx` — This is the primary file where the UI and state for the Layer 2 session activation live. The stepper needs to be integrated here, and the transition between steps needs to be animated.

### Approaches
1. **Tailwind-based Stepper Component (Inline or Extracted)** — Create a 2-step visual indicator ("caminito") directly in `ActivarSesionPage.tsx` using Tailwind CSS and `lucide-react` icons (e.g., `User` for Legajo, `Lock` for PIN). A progress bar line connects the two steps, filling up with a `transition-all duration-500 ease-in-out` when moving to the PIN step.
   - Pros: Simple, zero new dependencies, leverages existing Tailwind configuration, highly customizable.
   - Cons: Animations are limited to CSS transitions (no complex spring physics unless we write custom CSS).
   - Effort: Low

2. **Introduce an Animation Library (e.g., Framer Motion)** — Add `framer-motion` to handle complex slide-in/slide-out animations for both the stepper and the keypad/input area.
   - Pros: Smoother, more complex animations with spring physics.
   - Cons: Adds a dependency, increases bundle size, overkill for a simple 2-step stepper.
   - Effort: Medium

### Recommendation
**Approach 1 (Tailwind-based Stepper Component)** is the recommended path. We already have `lucide-react` and `tailwindcss` installed. We can build a beautiful, responsive stepper with icons, an animated connecting line, and scale/color transitions purely with Tailwind utility classes. We can also add a simple fade/slide transition to the main input display when the step changes to make the experience feel more cohesive.

### Risks
- Ensure the stepper is visible and well-proportioned on the tablet screen size.
- Ensure the state doesn't reset accidentally during animations.

### Ready for Proposal
Yes. The orchestrator can proceed to the `sdd-propose` phase.
