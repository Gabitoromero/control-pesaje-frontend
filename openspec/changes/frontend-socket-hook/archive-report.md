# Archive Report: frontend-socket-hook

**Change**: Remove `isEstable` from the WebSocket hook and all its consumers.
**Closed**: 2026-06-18
**Final status**: ARCHIVED — PASS

---

## Summary

Removed the `isEstable` boolean from the `useBalanzaWebSocket` hook and all consumer code in `TabletWorkspace.tsx`. The KRETZ scale always sends the last stable value, making `isEstable` perpetually true and therefore a meaningless signal that caused a permanently stuck "Balanza en movimiento..." UI state.

Connection state (`isConnected`) is now the sole signal for UI readiness, register gating, and status display.

---

## Files Changed

- `frontend/src/features/tablet/hooks/useBalanzaWebSocket.ts`
  - Removed `isEstable: boolean` from `BalanzaData` interface
  - Removed `isEstable` state variable, setter calls, and return value
- `frontend/src/features/tablet/pages/TabletWorkspace.tsx`
  - Removed `isEstable` from hook destructure
  - Register guard: `isEstable && isConnected` → `isConnected`
  - Status dot: `isEstable ? 'bg-green-500' : 'bg-amber-500'` → `isConnected ? ...`
  - Status label: nested ternary with `isEstable` → `isConnected ? 'Conectado' : 'Sin señal'`
  - Button disabled: `!isEstable || !isConnected` → `!isConnected`

---

## Artifacts

| Artifact | Backend | Topic / Path |
|----------|---------|--------------|
| spec | engram | sdd/frontend-socket-hook/spec |
| tasks | engram | sdd/frontend-socket-hook/tasks |
| apply-progress | engram | sdd/frontend-socket-hook/apply-progress |
| verify-report | engram + openspec | sdd/frontend-socket-hook/verify-report |
| archive-report | engram + openspec | sdd/frontend-socket-hook/archive-report |

---

## Verification Results

- CRITICAL: 0
- WARNING: 0
- SUGGESTION: 0
- Type-check: zero errors (pnpm tsc --noEmit, EtapasPage noise filtered)
- Tasks: 2/2 complete
