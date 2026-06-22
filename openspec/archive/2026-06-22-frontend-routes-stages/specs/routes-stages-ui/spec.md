# routes-stages-ui Specification

## Purpose
Provide a comprehensive user interface for creating and managing `RutaPasada` entities along with their nested, ordered `RutaPasadaEtapa` records.

## Requirements

### Requirement: Dedicated Route Form Page
The system MUST provide dedicated pages (`/rutas/new` and `/rutas/:id`) to handle the complex form state required for routes and stages.

#### Scenario: Navigating to create a new route
- GIVEN the user is on the `RutasPage` list
- WHEN the user clicks "Nueva Ruta"
- THEN the system MUST route the user to `/rutas/new`

### Requirement: Stages (Etapas) Management
The route form MUST allow adding, removing, and reordering stages.

#### Scenario: Adding a stage to a route
- GIVEN the user is on the route form
- WHEN the user clicks "Agregar Etapa"
- THEN a new empty stage row MUST be added to the end of the list
- AND the new stage MUST require fields: Article, Stage, Minimum Weight, Maximum Weight, Ideal Weight, and Sample Count.

#### Scenario: Reordering stages
- GIVEN a route with multiple stages
- WHEN the user clicks "Move Up" or "Move Down" on a stage
- THEN the stage's order MUST be updated
- AND the UI MUST reflect the new order immediately

### Requirement: Payload Submission
The system MUST assemble the form data into the `RutaCreate` payload format required by the backend.

#### Scenario: Saving a valid route
- GIVEN the user has filled out the route details and at least one stage correctly
- WHEN the user clicks "Guardar"
- THEN the system MUST submit the payload with the nested `etapas` array to the `api/rutas` endpoint
- AND redirect back to the `RutasPage` upon success
