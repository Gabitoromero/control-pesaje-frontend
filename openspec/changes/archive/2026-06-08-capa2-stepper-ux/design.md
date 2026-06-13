# Design: Capa 2 Stepper UX

## Technical Approach

Introduce an inline React block or component for a Stepper inside `ActivarSesionPage.tsx` using Tailwind CSS for styling and layout, and `lucide-react` for iconography. We will rely on pure CSS transitions (`transition-colors`, `transition-all`) to handle the visual changes when the user switches from the 'legajo' step to the 'pin' step, avoiding any external animation libraries.

## Architecture Decisions

### Decision: Inline Component vs Shared Component

**Choice**: Build the Stepper inline directly inside `ActivarSesionPage.tsx`.
**Alternatives considered**: Extracting a shared reusable UI component like `src/components/ui/Stepper.tsx`.
**Rationale**: This stepper is currently highly specific to the Layer 2 authentication flow (Legajo -> PIN) with specific icons and steps. Extracting it prematurely adds unnecessary abstraction. It can be refactored into a shared component later if other areas need it.

### Decision: Animation Mechanism

**Choice**: Tailwind CSS transition utilities (`transition-colors`, `transition-all`, `duration-300`).
**Alternatives considered**: Framer Motion or React Spring.
**Rationale**: The proposal explicitly limits adding heavy animation libraries. Tailwind utilities are lightweight, native to the existing stack, and perfectly adequate for color interpolation and active state transitions.

## Data Flow

    [User Action (Continuar)] ──→ [ActivarSesionPage State: setStep('pin')]
                                         │
                                         └─→ [Stepper Component / UI block]
                                         │    (Re-renders reflecting active state)
                                         │
                                         └─→ [UI Updates: Colors, Connecting Line]

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/features/tablet/pages/ActivarSesionPage.tsx` | Modify | Add `User` and `Lock` imports from `lucide-react`. Create the Stepper UI markup with a connecting line. Render the stepper above the current title/instructions. |

## Interfaces / Contracts

No new global interfaces or contracts are introduced. The inline Stepper will use the existing `Step` type defined in `ActivarSesionPage.tsx`:

```typescript
type Step = 'legajo' | 'pin';
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit/Integration | Stepper Rendering | Verify that both steps render with correct active/inactive styling based on the current step state. |
| Integration | Step Transition | Verify that submitting a valid 'legajo' transitions the state to 'pin' and correctly updates the active visual indicator in the stepper. |

## Migration / Rollout

No migration required. This is purely a stateless UI enhancement on the frontend.

## Open Questions

- [ ] None.
