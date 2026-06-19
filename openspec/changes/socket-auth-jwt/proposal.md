# Proposal: Socket.IO Tablet JWT Authentication

## Intent

Tablets currently connect to the Socket.IO server fully anonymous: `deviceAuthMiddleware`
calls `next()` with no validation when `deviceSecret` is absent. There is no user identity
on `socket.data`, so the realtime layer cannot attribute actions, enforce per-line access,
or audit who is viewing scale data. This change authenticates tablet sockets with the same
JWT already used by the HTTP API, closing the anonymous-socket gap and enabling future
identity-aware handlers (RF: authenticated realtime access).

## Scope

### In Scope
- Backend: add `tabletJwtMiddleware` as a second `io.use()` that validates
  `socket.handshake.auth.token`, attaches `socket.data.user`, rejects unauthenticated tablets.
- Backend: declare a typed `SocketData` interface (`isDevice?`, `user?: JWTPayload`).
- Backend: register the second middleware in `socket/index.ts` after `deviceAuthMiddleware`.
- Backend: new test suite for `tabletJwtMiddleware` (valid, invalid, expired, missing secret).
- Frontend: inject the cookie `token` into the socket handshake `auth` at creation time.
- Frontend: recreate the socket singleton when the token changes (login/logout lifecycle).

### Out of Scope
- Mid-connection token refresh (`handshake.auth` is immutable after connect; 12h expiry mitigates).
- WSS / TLS termination (production infra concern, not application code).
- Per-handler authorization beyond connection-time auth (e.g. role checks in `join-linea`).

## Capabilities

### New Capabilities
- `socket-auth`: connection-time authentication for the Socket.IO layer — device path
  (DEVICE_SECRET) and tablet path (JWT), with typed `socket.data` identity.

### Modified Capabilities
- None.

## Approach (B — two chained middlewares)

Keep `deviceAuthMiddleware` unchanged. Add `tabletJwtMiddleware` registered second.
Chain semantics that prevent double-calling `next`:

1. `deviceAuthMiddleware`: if `deviceSecret` present → validate, set `isDevice`, `next()`.
   On failure → `next(error)` and the connection is rejected (chain stops, second middleware never runs).
   If `deviceSecret` absent → `next()` (defers tablet decision downstream).
2. `tabletJwtMiddleware`: if `socket.data.isDevice` is already true → `return next()` immediately
   (device already authenticated, skip JWT). Else require `auth.token`: verify with `JWT_SECRET`,
   attach `socket.data.user`, `next()`; on missing/invalid/expired token → `next(error)`.

Each middleware owns exactly one path and calls `next` exactly once per invocation. The
`isDevice` short-circuit guarantees the two middlewares never both attempt to reject the
same socket. Fail-closed when `JWT_SECRET` is unset (consistent with the device path).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/socket/auth.middleware.ts` | Modified | Add `tabletJwtMiddleware`, export `SocketData` |
| `backend/src/socket/index.ts` | Modified | Register second `io.use()` |
| `backend/src/socket/auth.middleware.test.ts` | New/Modified | JWT tablet test cases |
| `frontend/src/services/websocket.ts` | Modified | Inject cookie token into `auth`; singleton recreate |
| `frontend/src/features/tablet/hooks/useBalanzaWebSocket.ts` | Modified (maybe) | Pass token / trigger recreate |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Frontend singleton reconnects with a stale token after logout/login | Med | Teardown + recreate socket on token change; read cookie at create time |
| Token in handshake is plaintext without TLS | Med | Require WSS in production (out of scope, document for infra) |
| Both middlewares reject the same socket / double `next(error)` | Low | `isDevice` short-circuit in tablet middleware; one `next` per path |
| `JWT_SECRET` unset causes silent pass | Low | Fail-closed: reject when secret missing |

## Rollback Plan

Revert is isolated and low-risk. Backend: remove the `io.use(tabletJwtMiddleware)` line in
`socket/index.ts` — tablets immediately return to pass-through behavior; the middleware code
and `SocketData` type can stay harmlessly. Frontend: remove the `auth` injection so the socket
connects without a token (server tolerates this only while the middleware is unregistered).
No DB or schema changes, so rollback is a code-only revert.

## Dependencies

- `jsonwebtoken` (already a dependency, used by HTTP auth).
- `JWT_SECRET` env var (already configured for HTTP auth).
- Frontend cookie `token` (already set on login).

## Success Criteria

- [ ] A tablet without a valid JWT in `auth.token` is rejected at connection.
- [ ] A tablet with a valid JWT connects and `socket.data.user` carries the decoded payload.
- [ ] Device connections (DEVICE_SECRET) still authenticate unchanged.
- [ ] `tabletJwtMiddleware` test suite passes (valid, invalid, expired, missing secret).
- [ ] Frontend socket carries a fresh token after logout/login (no stale-token reconnect).
