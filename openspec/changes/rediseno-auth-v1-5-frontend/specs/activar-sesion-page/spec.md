# Activar Sesion Page Specification

## Purpose

Allows an authenticated operator to open a line session.
Delegates HTTP to `abrirSesionLinea` and state to `AuthContext.openLineSession`.
Visual design is unchanged from the previous version.

## Requirements

### Requirement: Open Line Session on Submit

On submit, the page MUST call `abrirSesionLinea({ lineaId })`.
On success (`201`), it MUST call `AuthContext.openLineSession(lineaId)`
and navigate to `TabletWorkspace`.

#### Scenario: Successful line activation

- GIVEN an authenticated user selects a line
- WHEN the confirm action is triggered
- THEN `abrirSesionLinea({ lineaId })` MUST be called
- AND on success, `AuthContext.openLineSession(lineaId)` MUST be called
- AND the user MUST be navigated to `TabletWorkspace`

---

### Requirement: 409 SESSION_CONFLICT Handling

If `abrirSesionLinea` rejects with `409 SESSION_CONFLICT`, the page MUST
display a message identifying which line is already occupied.
The operator MUST be able to choose a different line without a page reload.

#### Scenario: Line already occupied

- GIVEN another operator has an active session on line 4
- WHEN the user attempts to activate line 4
- THEN a conflict message MUST appear naming line 4
- AND the user MUST remain on `ActivarSesionPage` to select another line

---

### Requirement: Non-409 Errors

Errors other than `409` MUST display a generic error message and leave
the page in a recoverable state (button re-enabled, no navigation).

#### Scenario: Server error during activation

- GIVEN `abrirSesionLinea` rejects with a non-409 error
- WHEN the error is caught
- THEN a generic error message MUST be shown
- AND the submit button MUST be re-enabled
