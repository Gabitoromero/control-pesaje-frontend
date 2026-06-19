# Tasks: socket-auth-jwt

Generated: 2026-06-19
Change: socket-auth-jwt
Spec: sdd/socket-auth-jwt/spec
Design: sdd/socket-auth-jwt/design

## Delivery

All tasks are sequentially ordered. Backend tasks (T1–T5) complete first; frontend tasks (T6–T8) follow. Within each group, tasks marked `[parallel-safe]` may be worked on in isolation but their commits land in order. Test tasks always precede their production counterpart (Strict TDD).

## Review Workload Forecast

| Metric | Value |
|---|---|
| Estimated changed lines | ~200 |
| Files touched | 6 |
| Chained PRs recommended | No |
| 400-line budget risk | Low |

---

## Backend Tasks

### [x] T1 — Augment SocketData type + export JWTPayload re-use
**File**: `backend/src/socket/auth.middleware.ts`
**Spec requirement**: Requirement: SocketData Interface
**Order**: 1 (sequential — all other tasks depend on the type)
**Strict TDD**: No production code yet — type-only change, verified by TypeScript compilation in T2.

**What to do**:
1. Add `declare module 'socket.io'` block at the top of `auth.middleware.ts` augmenting `SocketData` with `isDevice?: boolean; user?: JWTPayload; lineaId?: number`.
2. Import `JWTPayload` from `../../middlewares/auth.middleware` if not already imported.
3. Run `cd backend && pnpm tsc --noEmit` — must pass with zero errors.

**Commit message**: `feat(socket): augment SocketData with isDevice, user, lineaId`

---

### [x] T2 — Write tests for tabletJwtMiddleware (RED phase)
**File**: `backend/src/socket/auth.middleware.test.ts`
**Spec requirement**: Requirement: tabletJwtMiddleware — Device Short-Circuit, Missing Token Rejection, Invalid/Expired Token Rejection, Valid Token Acceptance, Fail-Closed on Missing Secret
**Order**: 2 (sequential — tests must be red before T3)
**Strict TDD**: This IS the TDD red phase.

**What to do**:
Add a `describe('tabletJwtMiddleware', ...)` block with the following test cases. Use `makeSocket` (or equivalent factory already present in this file) to construct mock sockets. Use real `jsonwebtoken` for signing.

Test cases (all must FAIL at commit time — function does not exist yet):
1. `isDevice=true` → calls `next()` with no error, `socket.data.user` stays `undefined`.
2. No token present → calls `next(new Error('unauthorized'))`.
3. Token is empty string → calls `next(new Error('unauthorized'))`.
4. Token has invalid signature → calls `next(new Error('unauthorized'))`.
5. Token is expired → calls `next(new Error('unauthorized'))`.
6. Token is valid → calls `next()` with no error; `socket.data.user` equals decoded payload.
7. `JWT_SECRET` env var is unset → calls `next(new Error('unauthorized'))` even with a structurally valid token.

**Commit message**: `test(socket): add tabletJwtMiddleware red-phase tests`

---

### [x] T3 — Implement tabletJwtMiddleware (GREEN phase)
**File**: `backend/src/socket/auth.middleware.ts`
**Spec requirement**: Same as T2 (all tabletJwtMiddleware requirements)
**Order**: 3 (sequential — must follow T2; all T2 tests must go green)

**What to do**:
Implement and export `tabletJwtMiddleware`:

```
if socket.data.isDevice → return next()
token = socket.handshake.auth.token
if (!token || typeof token !== 'string') → return next(new Error('unauthorized'))
secret = process.env.JWT_SECRET
if (!secret) → return next(new Error('unauthorized'))
try {
  payload = jwt.verify(token, secret) as JWTPayload
  socket.data.user = payload
  next()
} catch {
  next(new Error('unauthorized'))
}
```

Run `cd backend && pnpm test run` — all T2 tests must pass, zero regressions.

**Commit message**: `feat(socket): implement tabletJwtMiddleware`

---

### [x] T4 — Register tabletJwtMiddleware in socket server
**File**: `backend/src/socket/index.ts`
**Spec requirement**: Implicit from design (two io.use() middlewares in order)
**Order**: 4 (sequential — T3 must be committed first)
**Parallel-safe**: No

**What to do**:
1. Import `tabletJwtMiddleware` from `./auth.middleware`.
2. Add `io.use(tabletJwtMiddleware)` on the line immediately after `io.use(deviceAuthMiddleware)`.
3. Run `cd backend && pnpm test run` — full suite green.
4. Run `cd backend && pnpm tsc --noEmit` — zero errors.

**Commit message**: `feat(socket): register tabletJwtMiddleware after deviceAuthMiddleware`

---

### [x] T5 — Add join-linea authentication guard + tests
**Files**: `backend/src/socket/balanza.handler.ts`, `backend/src/socket/balanza.handler.test.ts`
**Spec requirement**: Requirement: join-linea Authentication Gate
**Order**: 5 (sequential — T4 must be committed; SocketData types required)
**Strict TDD**: Write test first (red), then guard (green), in the same commit batch — or split into T5a/T5b if preferred.

**What to do**:

*Test first* — add to `balanza.handler.test.ts`:
- Test: socket where `isDevice=false` and `user=undefined` emits `join-linea` → handler emits `error` event with `{ message: 'Unauthorized' }` and does NOT join any room.
- Test: socket where `user` is a valid `JWTPayload` → handler joins the room normally (existing happy-path coverage is sufficient; confirm it still passes).

*Then implementation* — in `balanza.handler.ts`, inside the `join-linea` handler, after the `lineaId` integer validation and before the DB lookup, add:

```typescript
if (!socket.data.isDevice && !socket.data.user) {
  socket.emit('error', { message: 'Unauthorized' });
  return;
}
```

Run `cd backend && pnpm test run` — all tests green.

**Commit message**: `feat(socket): guard join-linea against unauthenticated sockets`

---

## Frontend Tasks

### [x] T6 — Update websocket.ts: token injection + resetSocket()
**File**: `frontend/src/services/websocket.ts`
**Spec requirement**: Requirement: Frontend Token Injection at Socket Creation, Frontend Socket Singleton Lifecycle
**Order**: 6 (sequential — backend must be complete and deployed/running for manual e2e; unit tests are self-contained)
**Strict TDD**: Write frontend unit tests before editing production code (T6a then T6b), or combine in one commit as red→green.

**What to do**:

*Tests (red phase)* — in a new or existing test file for `websocket.ts`:
1. `resetSocket()` — given a connected socket mock, after call: `disconnect()` was called, `removeAllListeners()` was called, next `getSocket()` returns a new instance.
2. `getSocket()` — reads current `Cookies.get('token')` at call time (mock js-cookie); the socket is created with `auth: { token: <mocked value> }`.
3. `getSocket()` — when cookie is absent, socket is created with `auth: { token: undefined }`.

*Production code*:
1. Import `Cookies` from `js-cookie`.
2. Inside `getSocket()`, before creating the io instance: `const token = Cookies.get('token')`.
3. Pass `auth: { token }` in the io options object.
4. Add `export function resetSocket()`: `socket?.disconnect(); socket?.removeAllListeners(); socket = null;`

Run `cd frontend && pnpm test run` — all tests green.

**Commit message**: `feat(websocket): inject JWT token from cookie + expose resetSocket`

---

### [x] T7 — Call resetSocket() in AuthContext on logout and login
**File**: `frontend/src/features/auth/context/AuthContext.tsx`
**Spec requirement**: Requirement: Frontend Socket Singleton Lifecycle (logout scenario)
**Order**: 7 (sequential — T6 must be committed so resetSocket is importable)

**What to do**:
1. Import `resetSocket` from `../../../services/websocket` (adjust relative path as needed).
2. In the `logout` function: call `resetSocket()` before navigating/clearing state.
3. In the `login` function: call `resetSocket()` after the token cookie is set (ensures stale singleton from a previous session is cleared before next `getSocket()` call).
4. Run `cd frontend && pnpm test run` — zero regressions.

**Commit message**: `feat(auth): call resetSocket on login and logout`

---

### [x] T8 — Frontend cross-user leak regression test
**File**: `frontend/src/features/auth/context/AuthContext.test.tsx` (or nearest AuthContext test file)
**Spec requirement**: Design testing strategy — test confirming lineaId clears on login (no cross-user leak)
**Order**: 8 (sequential — T7 must be committed)

**What to do**:
Add a test that simulates:
1. User A logs in → socket is created with User A's token.
2. User A logs out → `resetSocket()` is called.
3. User B logs in → `getSocket()` creates a new socket instance with User B's token.

Assert that the socket instance from step 3 is NOT the same object reference as step 1 (or that the mock `io` constructor was called twice with different tokens). This proves no cross-user singleton leak.

Run `cd frontend && pnpm test run` — all tests green.

**Commit message**: `test(auth): assert no cross-user socket singleton leak`

---

## Dependency Graph

```
T1 (SocketData type)
  └─> T2 (tabletJwtMiddleware tests — RED)
        └─> T3 (tabletJwtMiddleware impl — GREEN)
              └─> T4 (register middleware in index.ts)
                    └─> T5 (join-linea guard + tests)
                          └─> T6 (websocket.ts: token + resetSocket)
                                └─> T7 (AuthContext: resetSocket calls)
                                      └─> T8 (cross-user leak test)
```

All tasks are strictly sequential. No parallel tracks.

## Verification Commands

```bash
# After each backend task:
cd backend && pnpm test run

# After each frontend task:
cd frontend && pnpm test run

# TypeScript sanity (after T1 and T4):
cd backend && pnpm tsc --noEmit
cd frontend && pnpm tsc --noEmit
```
