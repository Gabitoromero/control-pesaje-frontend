# Login Page Specification

## Purpose

The login screen collects a single identifier (legajo or username) and a PIN,
then calls `loginApi` and populates `AuthContext`.

## Requirements

### Requirement: Single Identifier Field

The login form MUST have exactly one identifier field (accepting `legajo` or
`nombreUsuario`) and one `pin` field. Fields for separate username and password
MUST NOT exist.

#### Scenario: Form renders correct fields

- GIVEN the user navigates to `/login`
- WHEN the page renders
- THEN exactly one identifier input and one pin input MUST be visible

---

### Requirement: Submit Calls loginApi

On submit, the page MUST call `loginApi({ legajo: identifier, pin })`.
On success, it MUST call `AuthContext.login(token)` and redirect to the
authenticated home route.

#### Scenario: Successful login flow

- GIVEN valid identifier and pin
- WHEN the user submits the form
- THEN `loginApi` MUST be called with `{ legajo: identifier, pin }`
- AND `AuthContext.login(token)` MUST be called with the returned JWT
- AND the user MUST be redirected away from `/login`

---

### Requirement: Login Error Display

If `loginApi` rejects, the page MUST display an error message to the user.
The form MUST remain usable (not permanently disabled).

#### Scenario: Wrong credentials

- GIVEN the user enters an incorrect identifier or pin
- WHEN `loginApi` rejects
- THEN an inline error message MUST be shown
- AND the submit button MUST be re-enabled after the error
