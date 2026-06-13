# Specification: seleccion-linea

## Requirements

### REQ-1: Forward Navigation on Line Selection
The system MUST navigate the user to `/tablet/pasadas` instead of the workspace when a line is selected.

#### Scenarios
- **Scenario 1.1**: Given the user is on the `SeleccionLineaPage`, when they select a line, then the system navigates them to `/tablet/pasadas`.

### REQ-2: Role-based Exit Logic
The "Salir" button on the line selection screen MUST perform role-based navigation or logout.

#### Scenarios
- **Scenario 2.1**: Given the user role is `Jefe` or `Administrador`, when they click the "Salir" button, then the system redirects them to `/dashboard`.
- **Scenario 2.2**: Given the user role is `Operario`, when they click the "Salir" button, then the system performs a global logout.
