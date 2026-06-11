# API Auth Client Specification

## Purpose

Typed HTTP client functions for all v1.5 authentication endpoints.
All auth API calls MUST go through this module; ad-hoc Axios calls from
UI components are prohibited.

## Requirements

### Requirement: loginApi

`loginApi` MUST send `POST /auth/login` with body `{ legajo: string, pin: string }`
and return the JWT string on success.

#### Scenario: Successful login

- GIVEN valid credentials
- WHEN `loginApi({ legajo, pin })` is called
- THEN a `200` response MUST yield a JWT string

#### Scenario: Invalid credentials

- GIVEN wrong legajo or pin
- WHEN `loginApi` is called
- THEN the function MUST throw (or reject) so the caller can show an error

---

### Requirement: abrirSesionLinea

`abrirSesionLinea` MUST send `POST /sesion-linea` with body `{ lineaId: number }`,
authenticated with Bearer JWT.

#### Scenario: Session opened

- GIVEN an authenticated user and a valid lineaId
- WHEN `abrirSesionLinea({ lineaId })` is called
- THEN `201` response MUST be returned with no error

#### Scenario: Conflict — line already occupied

- GIVEN the target line already has an active session
- WHEN `abrirSesionLinea` is called
- THEN the function MUST throw an error identifiable as `409 SESSION_CONFLICT`
- AND the error payload MUST expose `lineaId` of the conflicting session

---

### Requirement: actualizarActividad

`actualizarActividad` MUST send `PATCH /auth/actividad` with Bearer JWT.

#### Scenario: Heartbeat sent

- GIVEN an active line session
- WHEN `actualizarActividad()` is called
- THEN a `200` response MUST be returned

---

### Requirement: getSesionActiva

`getSesionActiva` MUST send `GET /sesion-activa` with Bearer JWT and return `SesionActiva`.

#### Scenario: Returns session data

- GIVEN a valid JWT
- WHEN `getSesionActiva()` is called
- THEN the response MUST conform to type `SesionActiva`

---

### Requirement: cerrarSesionLinea

`cerrarSesionLinea` MUST send `DELETE /sesion-linea` with Bearer JWT.

#### Scenario: Session closed

- GIVEN an active line session
- WHEN `cerrarSesionLinea()` is called
- THEN a `200` or `204` MUST be returned and no error thrown
