# socket-auth Specification

## Purpose

Define connection-time authentication for the Socket.IO layer. Tablets authenticate via JWT (handshake auth token); devices authenticate via DEVICE_SECRET through the existing deviceAuthMiddleware. Both paths result in a typed `SocketData` identity on `socket.data`. Unauthenticated tablets MUST be rejected at connection time.

---

## Requirements

### Requirement: SocketData Interface

The system MUST declare a typed `SocketData` interface that covers both device and tablet identity fields. All fields are optional at the type level because a socket begins with no identity.

```typescript
interface SocketData {
  isDevice?: boolean;
  lineaId?: number;
  user?: JWTPayload;
}
```

`JWTPayload` is the existing type from `user-auth` (`id`, `nombreUsuario`, `rol`, `puedeTomarMuestrasLibres`).

#### Scenario: Typed socket.data is accessible in handlers

- GIVEN a connected socket has completed authentication
- WHEN a handler accesses `socket.data.user` or `socket.data.isDevice`
- THEN TypeScript MUST resolve both fields without `any` cast
- AND `socket.data.user` MUST be typed as `JWTPayload | undefined`

---

### Requirement: tabletJwtMiddleware — Device Short-Circuit

The system MUST register `tabletJwtMiddleware` as the second `io.use()` middleware, after `deviceAuthMiddleware`. When `socket.data.isDevice` is `true`, the middleware MUST call `next()` immediately and MUST NOT inspect or modify `socket.data.user`.

#### Scenario: Device socket bypasses JWT check

- GIVEN a socket where `socket.data.isDevice` is `true` (set by deviceAuthMiddleware)
- WHEN `tabletJwtMiddleware` is invoked
- THEN it MUST call `next()` with no error
- AND `socket.data.user` MUST remain `undefined`

---

### Requirement: tabletJwtMiddleware — Missing Token Rejection

When `socket.data.isDevice` is `false` or `undefined` AND `socket.handshake.auth.token` is absent or empty, the system MUST reject the connection.

#### Scenario: Tablet connects with no token

- GIVEN a socket with `socket.data.isDevice` not set
- AND `socket.handshake.auth.token` is absent
- WHEN `tabletJwtMiddleware` is invoked
- THEN it MUST call `next(new Error('unauthorized'))`
- AND the socket MUST NOT be allowed to proceed

---

### Requirement: tabletJwtMiddleware — Invalid or Expired Token Rejection

When a token is present but fails JWT verification (bad signature, expired, or malformed), the system MUST reject the connection.

#### Scenario: Tablet connects with expired token

- GIVEN `socket.handshake.auth.token` is a JWT that has passed its `exp` claim
- WHEN `tabletJwtMiddleware` is invoked
- THEN it MUST call `next(new Error('unauthorized'))`

#### Scenario: Tablet connects with tampered token

- GIVEN `socket.handshake.auth.token` has an invalid signature
- WHEN `tabletJwtMiddleware` is invoked
- THEN it MUST call `next(new Error('unauthorized'))`

---

### Requirement: tabletJwtMiddleware — Valid Token Acceptance

When a valid JWT is present and `socket.data.isDevice` is not `true`, the system MUST attach the decoded payload and allow the connection.

#### Scenario: Tablet connects with valid token

- GIVEN `socket.handshake.auth.token` is a valid, non-expired JWT signed with JWT_SECRET
- AND `socket.data.isDevice` is not `true`
- WHEN `tabletJwtMiddleware` is invoked
- THEN it MUST set `socket.data.user` to the decoded `JWTPayload`
- AND it MUST call `next()` with no error

---

### Requirement: tabletJwtMiddleware — Fail-Closed on Missing Secret

When the `JWT_SECRET` environment variable is unset at middleware invocation time, the system MUST reject the connection regardless of what token was provided. The system MUST NOT silently pass an unverified payload.

#### Scenario: JWT_SECRET is unset at runtime

- GIVEN `process.env.JWT_SECRET` is `undefined` or empty
- AND `socket.handshake.auth.token` is a structurally valid JWT
- WHEN `tabletJwtMiddleware` is invoked
- THEN it MUST call `next(new Error('unauthorized'))`
- AND `socket.data.user` MUST remain `undefined`

---

### Requirement: join-linea Authentication Gate

The `join-linea` socket event handler MUST require an authenticated user identity before joining a room. If `socket.data.user` is `undefined`, the handler MUST NOT join any room and MUST emit an error back to the client.

#### Scenario: Authenticated tablet joins a line room

- GIVEN a connected socket where `socket.data.user` is a valid `JWTPayload`
- WHEN the client emits `join-linea` with a valid `lineaId`
- THEN the socket MUST join the room for that `lineaId`

#### Scenario: Unauthenticated socket attempts join-linea

- GIVEN a connected socket where `socket.data.user` is `undefined`
- WHEN the client emits `join-linea`
- THEN the handler MUST emit an error event to the client
- AND MUST return without joining any room

---

### Requirement: Frontend Token Injection at Socket Creation

The frontend socket factory (`getSocket()`) MUST read the JWT from the `token` cookie at call time and pass it as `socket.handshake.auth.token`. The token value MUST be read fresh each time `getSocket()` creates a new socket instance.

#### Scenario: Socket created after login carries a fresh token

- GIVEN the user has logged in and the `token` cookie is set
- WHEN `getSocket()` is called
- THEN the socket MUST be created with `auth: { token: <cookie value> }`
- AND the token MUST match the current `token` cookie at creation time

#### Scenario: Socket created before login carries no token

- GIVEN the `token` cookie is absent
- WHEN `getSocket()` is called
- THEN the socket MUST be created with `auth: { token: undefined }` or an absent token field
- AND the server MUST reject the connection with `unauthorized`

---

### Requirement: Frontend Socket Singleton Lifecycle

The frontend MUST expose a `resetSocket()` function that destroys the existing socket singleton, removes all event listeners, and clears the internal reference. Calling `getSocket()` after `resetSocket()` MUST create a new socket instance, re-reading the cookie at that time.

#### Scenario: Logout triggers socket reset and reconnect carries new token state

- GIVEN an authenticated socket singleton exists
- WHEN the user logs out and `resetSocket()` is called
- AND `getSocket()` is subsequently called (e.g. on next login)
- THEN a new socket instance MUST be created
- AND the new instance MUST read the cookie at creation time (which may be absent or carry a new token)

#### Scenario: resetSocket() disconnects and cleans up existing socket

- GIVEN a connected socket singleton
- WHEN `resetSocket()` is called
- THEN the socket MUST be disconnected
- AND all registered event listeners MUST be removed
- AND the singleton reference MUST be cleared so the next `getSocket()` does not reuse the old instance
