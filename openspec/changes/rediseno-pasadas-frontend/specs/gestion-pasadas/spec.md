# Specification: gestion-pasadas

## Requirements

### REQ-1: Intermediate Screen Display
The system MUST provide a new route at `/tablet/pasadas` mapping to the `GestionPasadasPage` component.

#### Scenarios
- **Scenario 1.1**: Given a logged-in user who selects a line, when they are navigated to `/tablet/pasadas`, then the "Gestión de Pasadas" screen is displayed.

### REQ-2: Listing Active Pasadas
The screen MUST list active "pasadas" for the selected line.

#### Scenarios
- **Scenario 2.1**: Given active pasadas exist for a line, when the user visits `/tablet/pasadas`, then the list of pasadas is displayed.
- **Scenario 2.2**: Given no active pasadas exist for a line, when the user visits `/tablet/pasadas`, then an empty state message is shown.

### REQ-3: Navigation to Workspace
The user MUST be able to navigate from the pasadas screen to the scale reading workspace (`TabletWorkspace`).

#### Scenarios
- **Scenario 3.1**: Given the user is on the pasadas screen, when they select a pasada to process or initiate a new one, then they are navigated to the scale reading workspace.
