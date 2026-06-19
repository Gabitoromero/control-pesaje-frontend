# Design: Socket.IO Tablet JWT Authentication

## Technical Approach

Approach B: keep `deviceAuthMiddleware` untouched and add a second `io.use(tabletJwtMiddleware)` that authenticates non-device sockets with the same JWT the HTTP API already uses. `socket.data` becomes typed via Socket.IO v4 generics. Frontend reads the cookie token at socket-creation time and exposes `resetSocket()` so login/logout always reconnects with a fresh token.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|-----------------------|-----------|
| Auth chaining | Two separate `io.use()` middlewares | Single merged middleware | Single responsibility; device path stays unchanged, zero-risk rollback (delete one line) |
| Double-next safety | `isDevice` short-circuit at top of tablet middleware | Flag/try-catch coordination | Each middleware owns one path and calls `next` exactly once; device sockets never reach JWT logic |
| `socket.data` typing | Module augmentation of `socket.io` `SocketData` in `auth.middleware.ts` | Generic params threaded through every `Server`/`Socket` | Augmentation types `socket.data` globally with no signature churn; mirrors existing Express `Request` augmentation in `middlewares/auth.middleware.ts` |
| Missing `JWT_SECRET` | Fail-closed (`next(new Error('unauthorized'))`) | Pass-through | Consistent with device path; never silently authenticate |
| Frontend token read timing | Read cookie inside `getSocket()` | Read at module load | Module-load read captures a stale/absent token; logout->login would reconnect with the old token |
| Token transport | `handshake.auth.token` | `Authorization` header / query | `auth` is the Socket.IO-native channel and matches backend reader |

## Data Flow

```
Tablet connect ── handshake.auth.token ──> deviceAuthMiddleware
                                              │ no deviceSecret -> next()
                                              v
                                         tabletJwtMiddleware
                                              │ isDevice? -> next()  (device, skip)
                                              │ verify(token, JWT_SECRET)
                                              │   ok  -> socket.data.user = payload; next()
                                              │   bad -> next(Error 'unauthorized')
                                              v
                                         connection -> join-linea (guard: socket.data.user)

Device connect ── handshake.auth.deviceSecret ──> deviceAuthMiddleware (isDevice=true, next())
                                                    └─> tabletJwtMiddleware short-circuits
```

Frontend: `login()/logout()` -> `resetSocket()` -> next `getSocket()` reads fresh cookie -> new socket with current token.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/socket/auth.middleware.ts` | Modify | Add `tabletJwtMiddleware`; augment `socket.io` `SocketData` (`isDevice?`, `user?`, `lineaId?`) |
| `backend/src/socket/index.ts` | Modify | Register `io.use(tabletJwtMiddleware)` after `deviceAuthMiddleware` |
| `backend/src/socket/balanza.handler.ts` | Modify | `join-linea` guard: reject when neither `isDevice` nor `user` present |
| `backend/src/socket/auth.middleware.test.ts` | Modify | Add `tabletJwtMiddleware` describe block |
| `frontend/src/services/websocket.ts` | Modify | Read cookie in `getSocket()`; add `resetSocket()` |
| `frontend/src/features/auth/context/AuthContext.tsx` | Modify | Call `resetSocket()` in `logout` and `login` |

## Interfaces / Contracts

`SocketData` via module augmentation (reuses existing `JWTPayload` from `middlewares/auth.middleware.ts`):

```typescript
declare module 'socket.io' {
  interface SocketData {
    isDevice?: boolean;
    user?: JWTPayload;
    lineaId?: number;
  }
}
```

`tabletJwtMiddleware(socket, next)`: short-circuit on `isDevice`; read `handshake.auth.token` (must be string); fail-closed if `JWT_SECRET` unset; `jwt.verify` -> `socket.data.user`; any failure -> `next(new Error('unauthorized'))`.

`join-linea` guard (after the `lineaId` integer check, before DB lookup):
```typescript
if (!socket.data.isDevice && !socket.data.user) {
  socket.emit('error', { message: 'Unauthorized' });
  return;
}
```

`websocket.ts` shape: `getSocket()` reads `Cookies.get('token')`, builds `io(URL, { auth: { token }, autoConnect:false, ... })`; `resetSocket()` -> `socket?.disconnect(); socket?.removeAllListeners(); socket = null;`.

`AuthContext.tsx`: import `resetSocket`; call it inside `logout` (before redirect) and `login` (after setting token) so the next `getSocket()` picks up the new cookie.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Unit (backend) | `tabletJwtMiddleware`: skip on `isDevice`; missing token -> unauthorized; invalid -> unauthorized; expired -> unauthorized; valid -> `user` attached; `JWT_SECRET` unset -> unauthorized | Extend `auth.middleware.test.ts` with `makeSocket`, sign real tokens with `jsonwebtoken`, assert `next` call shape |
| Unit (backend) | `join-linea` rejects unauthenticated socket | Existing `balanza.handler.test.ts` pattern with `socket.data` empty |
| Unit (frontend) | `resetSocket()` disconnects + nulls; `getSocket()` injects current cookie token | Mock `socket.io-client` and `js-cookie` |

STRICT TDD: write each backend test before its production change.

## Migration / Rollout

No DB/schema changes. Rollback: delete the `io.use(tabletJwtMiddleware)` line (backend reverts to pass-through) and remove `auth`/`resetSocket` on frontend. Middleware code and `SocketData` type are harmless if left.

## Open Questions

- None blocking. WSS/TLS for plaintext token transport remains out of scope (production infra).
