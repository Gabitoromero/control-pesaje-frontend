# Tasks: frontend-socket-hook

Change: Remove `isEstable` from the WebSocket hook and all its consumers.
Estimated diff: ~15 deletions, ~8 additions. Well within 400-line budget.
Verification: `cd frontend && pnpm build` (TypeScript compile — zero errors required).

---

## T-01 — Remove `isEstable` from `useBalanzaWebSocket`

**File**: `frontend/src/features/tablet/hooks/useBalanzaWebSocket.ts`
**Spec ref**: REMOVED — "isEstable as WebSocket contract field"
**Depends on**: none (must run FIRST — narrows the type so T-02 compile errors guide the consumer edits)
**Parallel**: no — T-02 must follow

### Surgical edits (5 deletions)

| Location | Current | Action |
|----------|---------|--------|
| Line 6 | `isEstable: boolean;` inside `BalanzaData` | Delete |
| Line 11 | `const [isEstable, setIsEstable] = useState<boolean>(false);` | Delete |
| Line 30 | `setIsEstable(false);` inside `onDisconnect` | Delete |
| Line 35 | `setIsEstable(data.isEstable);` inside `onBalanzaData` | Delete |
| Line 56 | `return { pesoNeto, isEstable, isConnected };` | Change to `return { pesoNeto, isConnected };` |

### Acceptance
- `BalanzaData` interface has no `isEstable` field
- Hook return type is `{ pesoNeto: number; isConnected: boolean }` only
- No `useState` for `isEstable` remains
- TypeScript emits errors at every `isEstable` usage site in consumers — confirming T-02 scope

---

## T-02 — Remove `isEstable` from `TabletWorkspace`

**File**: `frontend/src/features/tablet/pages/TabletWorkspace.tsx`
**Spec ref**: MODIFIED — "Connectivity and Disconnect Protection"
**Depends on**: T-01 (type narrowing reveals every usage to fix)
**Parallel**: no — sequential after T-01

### Surgical edits (5 replacements across 4 logical touch points)

| Touch point | Line(s) | Current | Replacement |
|-------------|---------|---------|-------------|
| 1 — Destructure | 29 | `const { pesoNeto, isEstable, isConnected }` | `const { pesoNeto, isConnected }` |
| 2 — Register guard | 51 | `if (isEstable && isConnected)` | `if (isConnected)` |
| 3 — Status dot color | 104 | `isEstable ? 'bg-green-500' : 'bg-amber-500'` | `isConnected ? 'bg-green-500' : 'bg-amber-500'` |
| 4a — Status label | 106–109 | `isConnected ? (isEstable ? 'Peso Estable' : 'Balanza en movimiento...') : 'Balanza Desconectada'` | `isConnected ? 'Conectado' : 'Sin señal'` |
| 4b — Button `disabled` + className | 114–119 | `disabled={!isEstable \|\| !isConnected}` / `isEstable && isConnected` | `disabled={!isConnected}` / `isConnected` |

### Acceptance (from spec scenarios)
- Status dot: green (`bg-green-500`) when `isConnected`, amber (`bg-amber-500`) when not
- Status label: "Conectado" when `isConnected === true`; "Sin señal" when `isConnected === false`
- Register button: `disabled` only when `!isConnected`; enabled when connected
- `handleRegistrarMuestra` calls `addSample(pesoNeto)` when `isConnected`, does nothing otherwise
- No reference to `isEstable` remains anywhere in the file

---

## Execution Order

```
T-01 (hook) → T-02 (consumer)
```

Sequential. T-01 must land first so TypeScript compile errors pinpoint every consumer touch point that T-02 must fix.

---

## Verification Gate

After both tasks:

```bash
cd frontend && pnpm build
```

Must exit 0 with zero TypeScript errors. No manual test runner — build is the gate.

---

## Review Workload Forecast

| Metric | Value |
|--------|-------|
| Files changed | 2 |
| Estimated deletions | ~15 |
| Estimated additions | ~8 |
| Total estimated lines | ~23 |
| 400-line budget risk | None |
| Chained PRs recommended | No |
| Decision needed before apply | No |
