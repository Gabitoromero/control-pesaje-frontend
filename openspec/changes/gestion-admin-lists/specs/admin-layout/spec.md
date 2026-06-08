# Admin Layout Specification

## Purpose
Defines the dashboard sidebar navigation sections, routing, and role-based access control.

## Requirements

### Requirement: Sidebar Groupings
The system MUST visually group sidebar navigation into specific conceptual sections: Monitoreo, Planta, Gestión, and Reportes.

#### Scenario: Render sidebar groups
- GIVEN an authenticated user
- WHEN the dashboard sidebar is rendered
- THEN navigation links MUST be grouped under Monitoreo, Planta, Gestión, and Reportes headers
- AND the Planta link MUST route to `/tablet/seleccion-linea`

### Requirement: Role Guards for Gestión
The system MUST restrict visibility and route access of the Gestión section (and its child pages) to Admin users only.

#### Scenario: Admin access
- GIVEN an authenticated user with the Admin role
- WHEN they view the dashboard
- THEN the Gestión section MUST be visible in the sidebar

#### Scenario: Non-Admin access
- GIVEN an authenticated user without the Admin role
- WHEN they view the dashboard
- THEN the Gestión section MUST NOT be rendered
- AND direct navigation to any Gestión route MUST redirect to a safe default page
