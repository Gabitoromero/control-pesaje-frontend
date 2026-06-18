# Proposal: Frontend Socket Hook — Drop isEstable + JWT Handshake

## Intent

The KRETZ scale never reports an "unstable" state: while the weight changes it keeps re-sending the last stable value, so `isEstable` is always effectively true and carries no real signal. Keeping it makes the UI lie ("Balanza en movimiento..." never shows) and gates sample registration on a meaningless condition. Separately, the socket server now requires JWT auth, but the tablet handshake carries no token, so authenticated tablets cannot connect. Both defects live in the same socket data path and must ship together.

## Scope

### In Scope
- Remove `isEstable` from `BalanzaData` and the `useBalanzaWebSocket` return value.
- Replace the four `isEstable` touch points in `TabletWorkspace` with `isConnected`-based logic and "Conectado" / "Sin señal" UI text.
- Change the registration guard from `if (isEstable && isConnected)` to `if (isConnected)`.
- Add JWT to the socket handshake via `getSocket(token: string | null)`, with the token sourced from `useAuth().token`.

### Out of Scope
- Backend / Raspberry frame filtering — confirmed: Raspberry forwards ALL values including zero, dropping only invalid frames. No change needed there.
- Reading the token from the cookie inside the service layer (rejected — token comes from React context).
- Any restyling of `TabletWorkspace` unrelated to the status indicator or register button.
- New files or new socket events.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `tablet-operario-pesaje`: scale-status semantics change from "weight stability" to "socket connection", and sample registration is gated on connection rather than stability.

## Approach

1. `websocket.ts`: change `getSocket()` to `getSocket(token: string | null)` and pass `auth: { token }` to `io()`. Since the socket is a module-level singleton, re-create it when called with a different token than the one it was built with (close old, open new). This keeps auth explicit and testable, with no `js-cookie` dependency in the service layer.
2. `useBalanzaWebSocket.ts`: read `token` from `useAuth()`, pass it to `getSocket(token)`, drop `isEstable` from `BalanzaData` and from the returned object. Keep emitting `pesoNeto` and `isConnected`.
3. `TabletWorkspace.tsx`: replace all four `isEstable` usages — register guard, status dot color, status text ("Conectado" / "Sin señal"), and register button `disabled` — with `isConnected`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/services/websocket.ts` | Modified | `getSocket(token)` signature + `auth: { token }`; re-init on token change |
| `frontend/src/features/tablet/hooks/useBalanzaWebSocket.ts` | Modified | Drop `isEstable`; read token from `useAuth()`; pass to `getSocket` |
| `frontend/src/features/tablet/pages/TabletWorkspace.tsx` | Modified | Replace 4 `isEstable` touch points with `isConnected` logic + new copy |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Singleton created before login sends no token | Low | `getSocket(token)` re-inits when token differs; hook only mounts behind auth guards |
| Partial `isEstable` removal leaves broken UI | Medium | All four touch points changed atomically in one PR |
| No automated tests (strict_tdd false) | Medium | Type-checker + manual verification on tablet |

## Rollback Plan

Single PR, three files. Revert the PR (or `git revert` the commit) to restore `isEstable` and the parameterless `getSocket()`. No data migration, no backend change, no new files to clean up.

## Dependencies

- Socket server must accept and validate the JWT passed in the handshake `auth` payload.
- `useAuth()` exposes a valid `token` at the time `TabletWorkspace` mounts.

## Success Criteria

- [ ] `BalanzaData` and `useBalanzaWebSocket` no longer expose `isEstable`.
- [ ] Status indicator shows "Conectado" when `isConnected`, "Sin señal" otherwise.
- [ ] Sample registration and the register button are gated on `isConnected` only.
- [ ] Tablet connects to the authenticated socket server with the JWT in the handshake.
