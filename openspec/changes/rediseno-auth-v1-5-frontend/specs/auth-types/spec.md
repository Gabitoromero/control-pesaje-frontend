# Auth Types Specification

## Purpose

Type definitions that describe the authenticated user and the active line session.
All frontend auth logic MUST derive from these types.

## Requirements

### Requirement: User Type Shape

The `User` type MUST include `legajo: string`, `nombreUsuario: string`,
`tipoUsuario: string`, and `puedeTomarMuestrasLibres: boolean` (non-optional).
The field `lineaId` MUST NOT exist on `User`.

#### Scenario: JWT decoded into User

- GIVEN a JWT returned by `POST /auth/login`
- WHEN the frontend decodes the payload
- THEN the resulting object MUST conform to `User` with all required fields present
- AND `puedeTomarMuestrasLibres` MUST be a `boolean`, never `undefined`

#### Scenario: Missing legajo claim

- GIVEN a JWT that does not include the `legajo` claim
- WHEN the frontend decodes the payload
- THEN `User.legajo` SHALL be `undefined` at runtime but typed as `string`

---

### Requirement: SesionActiva Type Shape

The `SesionActiva` type MUST represent the response of `GET /sesion-activa`.
It MUST include `usuarioId: number | null` and `lineaId: number | null`.

#### Scenario: Active session

- GIVEN an operator with an active line session
- WHEN `GET /sesion-activa` responds
- THEN `SesionActiva.usuarioId` and `SesionActiva.lineaId` MUST be non-null numbers

#### Scenario: Expired line session

- GIVEN the line session has expired due to 5-minute inactivity
- WHEN `GET /sesion-activa` responds
- THEN `SesionActiva.usuarioId` MUST be `null`
- AND the response HTTP status MUST be `200` (NOT `401`)
