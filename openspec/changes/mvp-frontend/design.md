# Design: MVP Frontend — Controlador de Pesaje

## Technical Approach

Feature-Driven module isolation with three self-contained features (`tablet`, `dashboard`, `reports`) under `src/features/`. Infrastructure is shared (`src/api/`, `src/layouts/`, `src/shared/`). Auth is a cross-cutting feature (`src/features/auth/`). WebSocket telemetry is encapsulated in a hook and drives both the tablet lockout behavior and the dashboard grid reactivity. The router wires layouts; pages are thin orchestrators over feature components and hooks.

---

## Architecture Decisions

### Decision: Layout-Based Route Splitting
**Choice**: Two layout components (`TabletLayout`, `DashboardLayout`) wrapping feature pages via React Router v7 nested routes.  
**Alternatives**: Single layout with conditional rendering; per-page layout imports.  
**Rationale**: Fullscreen touch-optimized tablet UI and sidebar desktop UI are structurally incompatible. Nested routes keep Auth guard logic in one place per layout.

### Decision: `socket.io-client` for WebSocket
**Choice**: `socket.io-client` (room-based, reconnection built-in).  
**Alternatives**: Native `WebSocket` API; `reconnecting-websocket`.  
**Rationale**: Backend gateway already uses Socket.io. Room join via `lineaId` query param maps directly to backend rooms without custom logic.

### Decision: Local Sample State Before Backend Flush
**Choice**: `usePasadaState` keeps samples in React state during a stage; flush to backend only on stage close.  
**Alternatives**: Optimistic mutation via React Query on every sample confirmation.  
**Rationale**: Local discard (RF-06) requires in-memory manipulation before persistence. Optimistic mutations would need complex rollback for pre-close discards.

### Decision: Excel via Axios blob — No client-side `xlsx` lib
**Choice**: Backend generates `.xlsx`; frontend downloads as blob via `responseType: 'blob'`.  
**Alternatives**: `xlsx` / `sheetjs` on the client.  
**Rationale**: Report formatting (multi-sheet, "DESCARTADO" labels, traceability) is backend-owned business logic. No extra bundle weight.

### Decision: `recharts` for ControlChart
**Choice**: `recharts` (already common in React 19 ecosystem, composable API).  
**Alternatives**: `chart.js`, `visx`, raw SVG.  
**Rationale**: `ComposedChart` + `ReferenceLine` covers tolerance bands and scatter points with minimal custom code. No native charting lib in the current stack.

---

## Data Flow

```
WebSocket Gateway (Socket.io)
  │  room: lineaId
  ▼
useBalanzaWebSocket(lineaId)
  ├── pesoNeto, isEstable, isConnected
  │
  ├─► TabletLayout: isConnected=false → full-screen lockout overlay
  │
  └─► WeightVisualizer (pesoNeto, tolerances from receta)
        └── usePasadaState (local samples buffer)
              └── onStageClose → axios.post /muestras (batch flush)

REST API (Axios + JWT interceptor)
  ├── React Query → DashboardPage (line status grid)
  ├── React Query → ReportsPage (filter metadata)
  └── blob download → excelReportService (no state needed)
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/App.tsx` | Modify | Add nested routes for `/tablet/*` and `/dashboard/*` with layout wrappers and auth guards |
| `src/api/axios.ts` | Modify | Add `timeout: 5000` and 401 response interceptor for token expiry redirect |
| `src/api/endpoints.ts` | Create | REST endpoint constants (`MUESTRAS`, `PASADAS`, `LINEAS`, `REPORTES`) |
| `src/layouts/TabletLayout.tsx` | Create | Fullscreen layout with WS-disconnect lockout overlay |
| `src/layouts/DashboardLayout.tsx` | Create | Sidebar nav layout with role-based menu items |
| `src/shared/types/index.ts` | Create | Domain TypeScript interfaces: `Muestra`, `Pasada`, `LineaProduccion`, `RutaPasadaEtapa`, `TelemetryData` |
| `src/shared/constants/index.ts` | Create | `ESTADO_VALIDACION`, `ESTADO_PASADA`, tolerance defaults |
| `src/shared/utils/statistics.ts` | Create | `calcularPromedio`, `calcularDesviacionEstandar` pure functions |
| `src/features/auth/context/AuthContext.tsx` | Create | Auth provider: token, user role, assigned `lineaId` |
| `src/features/auth/components/NumericKeypad.tsx` | Create | Touch-optimized 8-digit PIN keypad for plant tablets |
| `src/features/tablet/hooks/useBalanzaWebSocket.ts` | Create | Socket.io hook: `pesoNeto`, `isEstable`, `isConnected` |
| `src/features/tablet/hooks/usePasadaState.ts` | Create | Local sample buffer, tolerance validation, discard, stage gate |
| `src/features/tablet/components/WeightVisualizer.tsx` | Create | Real-time weight display with analog scale bar |
| `src/features/tablet/components/StageGuide.tsx` | Create | Sequential stage progress indicator |
| `src/features/tablet/components/AbortPasadaDialog.tsx` | Create | Abort dialog requiring motivo text + supervisor PIN |
| `src/features/tablet/pages/TabletWorkspacePage.tsx` | Create | Main tablet orchestration page |
| `src/features/tablet/pages/PasadasHistoryPage.tsx` | Create | Daily lots list with resume / new-lot actions |
| `src/features/dashboard/hooks/useDashboardTelemetry.ts` | Create | Aggregates WS telemetry for all lines; React Query polling fallback |
| `src/features/dashboard/components/LineMonitorCard.tsx` | Create | Line status card (active / puesta-a-punto states) |
| `src/features/dashboard/components/ControlChart.tsx` | Create | Recharts scatter+reference-line statistical chart |
| `src/features/dashboard/components/MuestraAzarModal.tsx` | Create | Random quality audit sample form (optional artículo, no lote) |
| `src/features/dashboard/pages/DashboardPage.tsx` | Create | 13-line grid page (supervisor) |
| `src/features/dashboard/pages/AuditoriaPage.tsx` | Create | Quality inspection history page |
| `src/features/reports/services/excelReportService.ts` | Create | Blob download helper for three report types |
| `src/features/reports/pages/ReportsPage.tsx` | Create | Date-range filters + download buttons for all 3 report types |

---

## Interfaces / Contracts

```typescript
// src/shared/types/index.ts (key subset)
type EstadoValidacion = 'ok' | 'fuera_de_rango' | 'descartado';
type EstadoPasada = 'en_curso' | 'completa' | 'abortada';

interface Muestra {
  id: number;
  peso_neto: number;
  estado_validacion: EstadoValidacion;
  usuario_id: number;
  etapa_id: number;
  linea_produccion_id: number;
  articulo_id?: number;
  timestamp: Date;
}

interface RutaPasadaEtapa {
  etapa_id: number;
  nombre: string;
  peso_minimo: number;
  peso_maximo: number;
  peso_ideal: number;
  cantidad_muestras_requeridas: number;
}
```

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `calcularDesviacionEstandar`, tolerance validation in `usePasadaState`, `downloadReport` blob trigger | Manual + ESLint type-checking via `pnpm run build` |
| Integration | Auth guard redirects, WebSocket lockout overlay visibility | Manual QA on dev environment |
| E2E | Full tablet weighing flow, Excel download | Manual QA (no test runner available) |

---

## Migration / Rollout

No data migration required. New routes and features are additive. `src/pages/Login.tsx` remains untouched. `App.tsx` is extended to add new route branches. Existing `src/api/axios.ts` is modified non-destructively (adding timeout and 401 interceptor).

Install required package: `socket.io-client`, `recharts`.

---

## Open Questions
- [ ] Does the backend Socket.io gateway authenticate via JWT on the WS handshake, or is the `lineaId` room join unauthenticated?
- [ ] Are the three report endpoints (`/reportes/descargar/rendimiento`, `/trazabilidad`, `/calidad`) already stable in the backend API?
