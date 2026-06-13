# Session Management Specification

## Purpose

Handles authentication state, Layer 2 (Line) session assignment, and role-based conditional routing during the logout process.

## Requirements

### Requirement: Role-Based Logout Routing

The system MUST execute role-based conditional routing when a user initiates a logout from a production line.

#### Scenario: Operator initiates logout
- GIVEN a user with the `operario` role is assigned to a production line
- WHEN the user clicks "Salir"
- THEN the system MUST call the backend endpoint `/auth/cerrar-sesion` to unassign the production line
- AND the system MUST clear the local authentication token
- AND the system MUST redirect the user to `/login`

#### Scenario: Administrator initiates logout
- GIVEN a user with the `administrador` role is assigned to a production line
- WHEN the user clicks "Salir"
- THEN the system MUST call the backend endpoint `/auth/cerrar-sesion` to unassign the production line
- AND the system MUST retain the local authentication token
- AND the system MUST redirect the user to `/dashboard`

#### Scenario: Chief initiates logout
- GIVEN a user with the `jefe` role is assigned to a production line
- WHEN the user clicks "Salir"
- THEN the system MUST call the backend endpoint `/auth/cerrar-sesion` to unassign the production line
- AND the system MUST retain the local authentication token
- AND the system MUST redirect the user to `/dashboard`

#### Scenario: Role is undefined
- GIVEN a user with an undefined or missing role is assigned to a production line
- WHEN the user clicks "Salir"
- THEN the system MUST default to a safe full logout
- AND the system MUST call the backend endpoint `/auth/cerrar-sesion`
- AND the system MUST clear the local authentication token
- AND the system MUST redirect the user to `/login`

#### Scenario: Backend logout fails
- GIVEN any user is assigned to a production line
- WHEN the user clicks "Salir"
- AND the backend endpoint `/auth/cerrar-sesion` returns an error
- THEN the system SHOULD alert the user of the failure
- AND the system MAY force a full logout if the state becomes inconsistent

### Requirement: Exit Buttons Availability

The system MUST provide explicit actions to exit the Layer 2 session in all relevant line-assigned views.

#### Scenario: Exiting from Tablet Workspace
- GIVEN the user is viewing the Tablet Workspace
- WHEN the user looks for session controls
- THEN a "Salir" button MUST be present
- AND clicking the button MUST trigger the role-based logout routing

#### Scenario: Exiting from Seleccion Linea Page
- GIVEN the user is viewing the Seleccion Linea Page
- WHEN the user looks for session controls
- THEN a "Salir" button MUST be present
- AND clicking the button MUST trigger the role-based logout routing

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
