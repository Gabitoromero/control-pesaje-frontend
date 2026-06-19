# Verification Report: socket-auth-jwt

**Change**: socket-auth-jwt
**Date**: 2026-06-19
**Mode**: Strict TDD
**Verdict**: PASS WITH WARNINGS

---

## Task Completeness

| Task | Description | Status |
|------|-------------|--------|
| T1 | Augment SocketData type | DONE |
| T2 | tabletJwtMiddleware RED tests | DONE |
| T3 | tabletJwtMiddleware GREEN implementation | DONE |
| T4 | Register middleware in socket server | DONE |
| T5 | join-linea auth guard + tests | DONE |
| T6 | websocket.ts token injection + resetSocket() | DONE |
| T7 | AuthContext resetSocket on login/logout | DONE |
| T8 | Cross-user leak regression tests | DONE |

**8/8 tasks complete.**

---

## Build / Test Evidence

| Check | Command | Result |
|-------|---------|--------|
| Backend tests | `cd backend && pnpm test run` | 171/171 PASS |
| Frontend tests | `cd frontend && pnpm test` | 103/103 PASS |
| Backend TypeScript | `cd backend && pnpm tsc --noEmit` | Clean (0 errors) |
| Frontend TypeScript | `cd frontend && pnpm tsc --noEmit` | Clean (0 errors) |

> Note: `pnpm test run` in the frontend passes `run` as a filename filter and exits
> with code 1 (no files matched). The correct command is `pnpm test`. See W-01.

---

## Spec Compliance Matrix

### SR-JWT-01: SocketData Interface
**Spec**: `isDevice?`, `user?: JWTPayload`, `lineaId?` augmented on `socket.io` SocketData.
**Code**: `backend/src/socket/auth.middleware.ts` — `declare module 'socket.io'` block present.
**Tests**: Middleware chain integration tests access `socket.data.user` and `socket.data.isDevice`.
**Status**: PASS

### SR-JWT-02: tabletJwtMiddleware — Device Short-Circuit
**Spec**: `socket.data.isDevice === true` → `next()` immediately, `socket.data.user` untouched.
**Code**: `auth.middleware.ts` line 62 — `if (socket.data.isDevice) { return next(); }` before any JWT logic.
**Tests**: Unit test + chain integration test both assert `user` remains `undefined`.
**Status**: PASS

### SR-JWT-03: tabletJwtMiddleware — Missing Token Rejection
**Spec**: Token absent or empty → `next(new Error('unauthorized'))`.
**Code**: `auth.middleware.ts` line 74 — `if (typeof token !== 'string' || !token)` — covers both cases.
**Tests**: `'rejects with unauthorized when no token is provided'` — absent token path.
**Gap**: No explicit test for `token: ''` (empty string). Implementation handles it correctly.
**Status**: PASS

### SR-JWT-04: tabletJwtMiddleware — Invalid/Expired Token Rejection
**Spec**: Bad signature or expired → `next(new Error('unauthorized'))`.
**Code**: try/catch around `jwt.verify`; any throw → `next(new Error('unauthorized'))`.
**Tests**: Invalid token test + `expiresIn: -1` expired token test.
**Status**: PASS

### SR-JWT-05: tabletJwtMiddleware — Valid Token Acceptance
**Spec**: Valid JWT → `socket.data.user = decoded JWTPayload`, `next()` with no error.
**Code**: `jwt.verify` result cast to `JWTPayload`, assigned to `socket.data.user`, then `next()`.
**Tests**: `'attaches decoded payload to socket.data.user and calls next() when token is valid'`.
**Status**: PASS

### SR-JWT-06: tabletJwtMiddleware — Fail-Closed on Missing Secret
**Spec**: `JWT_SECRET` unset → reject, `socket.data.user` must remain `undefined`.
**Code**: Secret checked at lines 66–69, BEFORE token extraction — fail-closed ordering correct.
**Tests**: `'rejects with unauthorized when JWT_SECRET is unset (fail-closed)'` — asserts both error and `user` undefined.
**Status**: PASS

### SR-JWT-07: join-linea Authentication Gate
**Spec**: Unauthenticated socket → emit error, return without joining room.
**Code**: `balanza.handler.ts` lines 24–27 — `if (!socket.data.isDevice && !socket.data.user)` before DB lookup.
**Tests**: `'emits error and does not join when socket.data.user is undefined (unauthenticated tablet)'`.
**Status**: PASS

### SR-JWT-08: Frontend Token Injection at Socket Creation
**Spec**: `getSocket()` reads cookie fresh at creation time, passes `auth: { token }`.
**Code**: `websocket.ts` — `Cookies.get('token')` inside `if (!socket)` guard, passed to `io()`.
**Tests**: Token-present test, absent-token test, singleton test.
**Status**: PASS

### SR-JWT-09: Frontend Socket Singleton Lifecycle
**Spec**: `resetSocket()` disconnects, removes all listeners, clears reference. Next `getSocket()` uses fresh cookie.
**Code**: `websocket.ts` — `socket.disconnect()`, `socket.removeAllListeners()`, `socket = null`.
**Tests**: Lifecycle test asserts all three steps + fresh `io()` call with new token. AuthContext tests confirm resetSocket called on login and logout.
**Status**: PASS

### SR-JWT-10 (design): Middleware Registration Order
**Spec/Design**: `deviceAuthMiddleware` first, `tabletJwtMiddleware` second.
**Code**: `index.ts` lines 17–18.
**Status**: PASS

---

## Design Coherence

| Decision | Matches Design | Notes |
|----------|---------------|-------|
| Two separate `io.use()` calls | YES | `index.ts` lines 17–18 |
| isDevice short-circuit at top | YES | `auth.middleware.ts` line 62 |
| Fail-closed on missing JWT_SECRET | YES | Checked before token extraction |
| Cookie read inside `getSocket()` | YES | `websocket.ts` line 11 |
| `resetSocket`: disconnect + removeAllListeners + null | YES | All three steps present |
| join-linea guard before DB lookup | YES | `balanza.handler.ts` line 24 |
| login + logout both call `resetSocket` | YES | `AuthContext.tsx` lines 55, 71 |

No deviations from design.

---

## Issues

### WARNINGS

**W-01** — Misleading frontend test command in apply-progress
The apply-progress artifact records `pnpm test run ✅ 103/103` for the frontend. The actual correct command is `pnpm test` (the `package.json` script already embeds `vitest run`; appending `run` passes it as a file-name filter which matches nothing and exits 1). The test count (103) is accurate but the command string is wrong. No runtime or coverage impact — this is a documentation issue only.

### SUGGESTIONS

**S-01** — Empty-string token test case missing
SR-JWT-03 says "absent or empty". Implementation covers it (`!token` catches `''`) but no test exercises `auth: { token: '' }`. Adding one would make spec traceability explicit.

**S-02** — Tampered-token test uses garbage string, not a mis-signed JWT
The "tampered token" scenario in SR-JWT-04 is covered by `'not-a-valid-token'` (a garbage string). A sharper test would use `jwt.sign(payload, 'wrong-secret')` to simulate signature tampering specifically. Current coverage is sufficient but less precise against the spec scenario name.

---

## Final Verdict

**PASS WITH WARNINGS**

- CRITICAL: 0
- WARNING: 1 (W-01 — documentation only, no runtime impact)
- SUGGESTION: 2 (S-01, S-02 — minor test precision gaps)

All 9 spec requirements have passing runtime coverage. TypeScript is clean (backend + frontend). 8/8 tasks complete. Safe to proceed to `sdd-archive`.
