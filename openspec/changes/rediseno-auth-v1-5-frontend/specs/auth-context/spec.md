# AuthContext Specification

## Purpose

React context that owns the authentication state and line-session lifecycle.
It is the single source of truth for `user`, `token`, and `activeLineaId`.

## Requirements

### Requirement: JWT Decode on Login

`login(token: string)` MUST decode the JWT payload and populate `user`
(type `User`) from the claims, including `legajo`.
`activeLineaId` MUST remain `null` after login until a line session is opened.

#### Scenario: Login sets user from JWT

- GIVEN a JWT containing `{ legajo, nombreUsuario, tipoUsuario, puedeTomarMuestrasLibres }`
- WHEN `login(token)` is called
- THEN `AuthContext.user` MUST match the decoded claims
- AND `AuthContext.activeLineaId` MUST be `null`

---

### Requirement: activeLineaId State

`AuthContext` MUST expose `activeLineaId: number | null`.
`openLineSession(lineaId)` MUST set it; `closeLineSession()` MUST reset it to `null`.

#### Scenario: Open line session

- GIVEN the user is authenticated
- WHEN `openLineSession(3)` is called
- THEN `activeLineaId` MUST equal `3`

#### Scenario: Close line session

- GIVEN `activeLineaId` is `3`
- WHEN `closeLineSession()` is called
- THEN `activeLineaId` MUST be `null`

---

### Requirement: Global Logout Clears All State

`logout()` MUST clear `user`, `token`, and `activeLineaId` simultaneously.

#### Scenario: Logout resets context

- GIVEN user is authenticated with `activeLineaId = 5`
- WHEN `logout()` is called
- THEN `user`, `token`, and `activeLineaId` MUST all be `null`

---

### Requirement: Context Stability

Actions exposed by `AuthContext` (`login`, `logout`, `openLineSession`,
`closeLineSession`) MUST be referentially stable across renders
(wrapped in `useCallback` or equivalent).

#### Scenario: Re-render does not change action references

- GIVEN a consumer component subscribed to `AuthContext`
- WHEN an unrelated state change causes the provider to re-render
- THEN the action references MUST remain the same object references
