# Tasks: capa2-stepper-ux

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Not needed |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Core Implementation

- [x] 1.1 In `frontend/src/features/tablet/pages/ActivarSesionPage.tsx`, import `User` and `Lock` from `lucide-react`.
- [x] 1.2 In `frontend/src/features/tablet/pages/ActivarSesionPage.tsx`, create the inline Stepper UI markup featuring a connecting line and the imported icons.
- [x] 1.3 In `frontend/src/features/tablet/pages/ActivarSesionPage.tsx`, render the Stepper UI block above the current title/instructions, applying `transition-colors` and `transition-all` to ensure smooth visual updates based on the current `step` state ('legajo' vs 'pin').

## Phase 2: Verification

- [ ] 2.1 Verify locally that the Stepper correctly reflects the active step when loading the page and transitions smoothly to the Lock icon when advancing to the PIN step.
