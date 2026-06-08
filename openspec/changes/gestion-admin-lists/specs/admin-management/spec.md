# Admin Management Specification

## Purpose
Defines the frontend list pages, data tables, and API integrations for administrative entities (Articulos, Etapas, Lineas, Rutas, and Usuarios).

## Requirements

### Requirement: Entity List Pages
The system MUST provide list views for Articulos, Etapas, Lineas, Rutas, and Usuarios using HTML tables and React Query for state management.

#### Scenario: Load entity list
- GIVEN an Admin user
- WHEN navigating to any entity list page
- THEN the system MUST display a loading state during data fetching
- AND render the fetched records in a table format

### Requirement: Updated Data Models
The system MUST display newly added fields in the tables for specific entities.

#### Scenario: Display newly added fields
- GIVEN the API returns the updated data structures
- WHEN the Usuarios list is rendered
- THEN it MUST include the `legajo` column
- AND WHEN the Articulos list is rendered
- THEN it MUST include the `marca` column

### Requirement: Resilient Data Mapping
The system MUST safely handle missing or null fields within nested relations without crashing the table renderer.

#### Scenario: Null relation handling
- GIVEN the API returns an entity with a null nested relationship
- WHEN the table cell renders that relationship
- THEN the system MUST display a fallback empty string or default text instead of throwing an error
