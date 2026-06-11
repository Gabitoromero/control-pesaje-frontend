# Actividad Heartbeat Specification

## Purpose

React hook that keeps the server-side line session alive by sending
a periodic activity signal while the operator is in `TabletWorkspace`.

## Requirements

### Requirement: Periodic Heartbeat

`useActividadHeartbeat` MUST call `actualizarActividad()` every 2 minutes
while the hook is mounted and `activeLineaId` is non-null.

#### Scenario: Heartbeat fires during active session

- GIVEN `TabletWorkspace` is mounted with `activeLineaId = 3`
- WHEN 2 minutes elapse
- THEN `actualizarActividad()` MUST have been called exactly once per interval

#### Scenario: Heartbeat stops when unmounted

- GIVEN `useActividadHeartbeat` is active
- WHEN the component unmounts
- THEN the interval MUST be cleared and no further calls MUST occur

---

### Requirement: Inactive When No Line Session

The hook MUST NOT send any heartbeat when `activeLineaId` is `null`.

#### Scenario: No active line session

- GIVEN `activeLineaId` is `null`
- WHEN the hook is mounted
- THEN `actualizarActividad()` MUST NOT be called

---

### Requirement: 401 During Heartbeat

If `actualizarActividad()` receives a `401`, the global Axios interceptor
MUST handle logout. The hook MUST NOT implement its own logout logic.

#### Scenario: JWT expires during heartbeat

- GIVEN the JWT has expired
- WHEN the heartbeat fires and `actualizarActividad()` returns `401`
- THEN the Axios interceptor MUST trigger global logout
- AND the hook MUST NOT perform any additional cleanup beyond interval teardown on unmount
