# Axios Interceptor Specification

## Purpose

Global HTTP response interceptor that enforces session lifecycle rules.
The backend v1.5 never emits 401 for line-session expiry; therefore
401 ALWAYS means JWT expired → global logout.

## Requirements

### Requirement: 401 → Global Logout

Any `401 Unauthorized` response from ANY endpoint MUST trigger immediate
global logout: clear stored JWT, clear AuthContext state, and redirect
the user to `/login`.

#### Scenario: JWT expires mid-session

- GIVEN the user has a valid line session but the JWT has expired
- WHEN any Axios request receives a `401` response
- THEN the interceptor MUST clear auth state
- AND redirect to `/login`

#### Scenario: 401 on non-auth endpoint

- GIVEN the user is on `TabletWorkspace`
- WHEN a background request to `/actividad` returns `401`
- THEN the interceptor MUST trigger global logout (same as any other endpoint)

---

### Requirement: Non-401 Errors Pass Through

Responses with status codes other than `401` MUST NOT be intercepted.
They MUST be re-thrown so individual callers can handle them.

#### Scenario: 409 conflict is not intercepted

- GIVEN `POST /sesion-linea` returns `409`
- WHEN the interceptor processes the response
- THEN the error MUST be passed through to the calling function unchanged

#### Scenario: 500 server error passes through

- GIVEN any endpoint returns `500`
- WHEN the interceptor processes the response
- THEN the error MUST be re-thrown without triggering logout

---

### Requirement: Line Session Expiry Is NOT a 401

The frontend MUST NOT treat `GET /sesion-activa` returning `usuarioId: null`
as an error requiring logout. This is a `200` with empty session data.

#### Scenario: Polled session returns null

- GIVEN the line session expired due to inactivity
- WHEN `getSesionActiva()` returns `{ usuarioId: null, lineaId: null }`
- THEN the interceptor MUST NOT trigger logout
- AND the caller MUST handle the empty session data directly
