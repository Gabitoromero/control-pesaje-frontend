# Apply Progress: frontend-socket-hook

**Change**: Remove `isEstable` from the WebSocket hook and all its consumers.
**Mode**: Standard (strict_tdd: false)
**Verification**: `cd frontend && pnpm build` — zero `isEstable` errors. Pre-existing `TS6133` warnings in `EtapasPage.test.tsx` are unrelated to this change.

---

## Tasks

- [x] T-01 — Remove `isEstable` from `useBalanzaWebSocket`
- [x] T-02 — Remove `isEstable` from `TabletWorkspace`

---

## T-01 — `useBalanzaWebSocket.ts`

**File**: `frontend/src/features/tablet/hooks/useBalanzaWebSocket.ts`
**Status**: COMPLETE

Edits applied:
1. Removed `isEstable: boolean` from `BalanzaData` interface
2. Removed `const [isEstable, setIsEstable] = useState<boolean>(false)` state variable
3. Removed `setIsEstable(false)` from `onDisconnect` handler
4. Removed `setIsEstable(data.isEstable)` from `onBalanzaData` handler
5. Changed return value from `{ pesoNeto, isEstable, isConnected }` to `{ pesoNeto, isConnected }`

---

## T-02 — `TabletWorkspace.tsx`

**File**: `frontend/src/features/tablet/pages/TabletWorkspace.tsx`
**Status**: COMPLETE

Edits applied:
1. Destructure (line 29): removed `isEstable` from `useBalanzaWebSocket` destructure
2. Register guard (line 51): `if (isEstable && isConnected)` → `if (isConnected)`
3. Status dot color (line 104): `isEstable ? 'bg-green-500' : 'bg-amber-500'` → `isConnected ? 'bg-green-500' : 'bg-amber-500'`
4. Status label (lines 106–109): nested ternary with `isEstable` → `isConnected ? 'Conectado' : 'Sin señal'`
5. Button disabled + className (lines 114–119): `!isEstable || !isConnected` / `isEstable && isConnected` → `!isConnected` / `isConnected`

---

## Verification

- `pnpm exec tsc --noEmit | rg -v EtapasPage.test` → no output (zero errors)
- `pnpm exec tsc --noEmit | rg isEstable` → no output (no isEstable errors)
- Pre-existing failures: 3x TS6133 in `EtapasPage.test.tsx` (unused imports, unrelated to this change, existed before this apply)

---

## Status

2/2 tasks complete. Ready for `sdd-verify`.
