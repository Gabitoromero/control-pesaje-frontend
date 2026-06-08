# Specification: ABM de Operarios

## Purpose
Define the behavioral and responsive design requirements for the Operarios (Usuarios) CRUD management interface, ensuring seamless usability across mobile, tablet, and desktop viewports.

## Requirements

### Requirement: Responsive List View
The system MUST render the list of Operarios dynamically based on the available viewport width.
- The system MUST render a vertical list of responsive `Cards` on mobile and tablet portrait orientations (screens `< md`).
- The system MUST render a standard data `<table>` on desktop and tablet landscape orientations (screens `>= md`).

#### Scenario: Mobile viewport viewing operarios
- GIVEN a user accessing the ABM on a mobile device
- WHEN the screen width is below the `md` breakpoint
- THEN the application hides the table view
- AND displays each operario as a Card containing their details and action buttons

#### Scenario: Desktop viewport viewing operarios
- GIVEN a user accessing the ABM on a desktop device
- WHEN the screen width is above or equal to the `md` breakpoint
- THEN the application hides the card view
- AND displays the operarios in a standard data table

### Requirement: Full-Screen Mobile Modal
The system MUST provide a fully responsive form modal for Create and Edit actions.
- On mobile viewports (`< md`), the modal MUST consume 100% of the screen width and height.
- On mobile viewports, the modal MUST feature `max-h-[90vh]` and internal vertical scrolling (`overflow-y-auto`) to prevent clipping when the OS virtual keyboard opens.
- On desktop viewports (`>= md`), the modal MUST behave as a centered, fixed-width dialog.

#### Scenario: Opening edit form on mobile
- GIVEN a user on a mobile device
- WHEN they tap "Edit" on an operario card
- THEN a full-screen modal opens containing the form
- AND the form allows vertical scrolling to accommodate the virtual keyboard

#### Scenario: Opening create form on desktop
- GIVEN a user on a desktop device
- WHEN they click "New Operario"
- THEN a centered dialog modal opens over the current view

### Requirement: CRUD Actions for Operarios
The system MUST allow users to fully manage operarios through the UI, utilizing the existing backend data fetching layer.
- The system MUST support reading (listing), creating, updating, and deleting operarios.

#### Scenario: Creating a new operario
- GIVEN an open Create modal
- WHEN the user fills out valid Operario details and submits
- THEN the system sends a POST request to the API
- AND updates the UI list to reflect the new operario upon success

#### Scenario: Updating an operario
- GIVEN an open Edit modal populated with operario data
- WHEN the user modifies the details and submits
- THEN the system sends a PUT request to the API
- AND updates the UI list to reflect the changes

#### Scenario: Deleting an operario
- GIVEN the operarios list view
- WHEN the user clicks "Delete" on an operario and confirms
- THEN the system sends a DELETE request to the API
- AND removes the operario from the UI list upon success
