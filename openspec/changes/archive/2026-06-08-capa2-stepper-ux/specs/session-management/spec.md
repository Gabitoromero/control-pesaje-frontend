# Delta for session-management

## ADDED Requirements

### Requirement: Layer 2 Activation Stepper UX

The system MUST display a visual stepper during the Layer 2 (Line) session activation process to indicate progress (Legajo -> PIN).

#### Scenario: User starts activation process
- GIVEN the user navigates to the session activation page
- WHEN the page loads in the Legajo input state (Step 1)
- THEN the system MUST display the stepper with the first step active
- AND the first step MUST display a User icon

#### Scenario: User advances to PIN input
- GIVEN the user has completed the Legajo input
- WHEN the system advances to the PIN input state (Step 2)
- THEN the system MUST transition the stepper to show the second step as active
- AND the second step MUST display a Lock icon
- AND the transition MUST use CSS transitions for smooth visual updates
