# Specification: tablet-workspace

## Requirements

### REQ-1: Non-destructive Return Navigation
The `TabletWorkspace` MUST provide a "Volver" button that navigates the user back to `/tablet/pasadas` without destroying the active line session.

#### Scenarios
- **Scenario 1.1**: Given the user is in the `TabletWorkspace`, when they click the "Volver" button, then they are navigated to `/tablet/pasadas`.
- **Scenario 1.2**: Given the user clicks "Volver", when they arrive at `/tablet/pasadas`, then the selected line session MUST remain active and valid.
