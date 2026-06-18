# Design: frontend-socket-hook (isEstable removal)

## Scope

Two files. No new files. No new exports. No third-party dependencies added.

---

## File 1 — `frontend/src/features/tablet/hooks/useBalanzaWebSocket.ts`

### Changes

#### 1. `BalanzaData` interface (lines 4–7)

Remove field `isEstable: boolean`.

Before:
```ts
export interface BalanzaData {
  pesoNeto: number;
  isEstable: boolean;
}
```

After:
```ts
export interface BalanzaData {
  pesoNeto: number;
}
```

#### 2. `isEstable` state variable (line 11)

Remove:
```ts
const [isEstable, setIsEstable] = useState<boolean>(false);
```

No replacement — field is deleted entirely.

#### 3. `onDisconnect` handler (lines 27–30)

Remove `setIsEstable(false)` call from handler body.

Before:
```ts
const onDisconnect = () => {
  setIsConnected(false);
  setPesoNeto(0);
  setIsEstable(false);
};
```

After:
```ts
const onDisconnect = () => {
  setIsConnected(false);
  setPesoNeto(0);
};
```

#### 4. `onBalanzaData` handler (lines 33–36)

Remove `setIsEstable(data.isEstable)` call.

Before:
```ts
const onBalanzaData = (data: BalanzaData) => {
  setPesoNeto(data.pesoNeto);
  setIsEstable(data.isEstable);
};
```

After:
```ts
const onBalanzaData = (data: BalanzaData) => {
  setPesoNeto(data.pesoNeto);
};
```

#### 5. Return value (line 56)

Remove `isEstable` from return tuple.

Before:
```ts
return { pesoNeto, isEstable, isConnected };
```

After:
```ts
return { pesoNeto, isConnected };
```

### TypeScript impact

- `BalanzaData` no longer has `isEstable`. Any code that reads `data.isEstable` off a `BalanzaData` value will produce a TypeScript error — compile-time safety catches stale usages.
- Hook return type narrows from `{ pesoNeto: number; isEstable: boolean; isConnected: boolean }` to `{ pesoNeto: number; isConnected: boolean }`. Destructuring `isEstable` from the hook return will error at compile time.

---

## File 2 — `frontend/src/features/tablet/pages/TabletWorkspace.tsx`

Four touch points, listed in order of appearance.

### Touch point 1 — Destructuring (line 29)

Remove `isEstable` from destructure.

Before:
```tsx
const { pesoNeto, isEstable, isConnected } = useBalanzaWebSocket(lineaId);
```

After:
```tsx
const { pesoNeto, isConnected } = useBalanzaWebSocket(lineaId);
```

### Touch point 2 — Register guard in `handleRegistrarMuestra` (line 51)

Change compound guard to connection-only.

Before:
```tsx
if (isEstable && isConnected) {
```

After:
```tsx
if (isConnected) {
```

### Touch point 3 — Status indicator dot color (line 104)

Change color condition from `isEstable` to `isConnected`.

Before:
```tsx
<div className={`w-4 h-4 rounded-full ${isEstable ? 'bg-green-500' : 'bg-amber-500'}`} />
```

After:
```tsx
<div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500'}`} />
```

### Touch point 4 — Status label text + register button `disabled` (lines 105–119)

**Status label** (lines 106–109): Replace the three-state `isConnected ? (isEstable ? ...) : ...` expression with a single two-state expression on `isConnected`.

Before:
```tsx
<span className="text-xl font-medium text-slate-600">
  {isConnected 
    ? (isEstable ? 'Peso Estable' : 'Balanza en movimiento...') 
    : 'Balanza Desconectada'}
</span>
```

After:
```tsx
<span className="text-xl font-medium text-slate-600">
  {isConnected ? 'Conectado' : 'Sin señal'}
</span>
```

**Register button `disabled` and className** (lines 114–119): Replace `!isEstable || !isConnected` with `!isConnected`; replace `isEstable && isConnected` conditional class with `isConnected`.

Before:
```tsx
disabled={!isEstable || !isConnected}
className={`w-full py-6 rounded-2xl text-2xl font-bold transition-all shadow-lg
  ${isEstable && isConnected
    ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
  }`}
```

After:
```tsx
disabled={!isConnected}
className={`w-full py-6 rounded-2xl text-2xl font-bold transition-all shadow-lg
  ${isConnected
    ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
  }`}
```

### TypeScript impact

No new types introduced. Removing `isEstable` from the destructure is sufficient — TypeScript will flag any remaining usages at compile time, making the removal self-verifying.

---

## Summary of all edits

| File | Lines affected | Nature |
|------|---------------|--------|
| `useBalanzaWebSocket.ts` | 4–7, 11, 27–30, 33–36, 56 | Delete field, state var, two setter calls, return value |
| `TabletWorkspace.tsx` | 29, 51, 104, 106–109, 114–119 | 5 surgical replacements across 4 logical touch points |

Total estimated diff: ~15 deletions, ~8 additions. Well within 400-line budget.

## Verification

- TypeScript compiler (`tsc --noEmit`) must pass with zero errors after the change.
- Manual tablet smoke test: status dot green + "Conectado" label when socket connects; amber + "Sin señal" when disconnected; "Registrar Muestra" button active only when connected.
