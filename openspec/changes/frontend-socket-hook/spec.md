# Delta for tablet-operario-pesaje

## MODIFIED Requirements

### Requirement: Connectivity and Disconnect Protection

The system MUST establish a continuous WebSocket connection to the weight gateway telemetry.
Scale connection state is the sole signal for determining UI readiness — weight stability (isEstable) is NOT a criterion.
The status indicator MUST reflect `isConnected` exclusively: green when connected, amber when not connected.
The status label MUST read "Conectado" when `isConnected === true` and "Sin señal" when `isConnected === false`.
The system MUST gate sample registration and the register button on `isConnected` only — not on any stability flag.

(Previously: status dot color and status text were driven by `isEstable`; registration was gated on `isEstable && isConnected`.)

#### Scenario: Real-time Weight Streaming

- GIVEN the operator is on the active weighing view
- WHEN the WebSocket connection is active and broadcasting telemetry
- THEN the system MUST display the live weight on the digital scale visualizer in real time

#### Scenario: Connectivity Loss Lockout

- GIVEN the operator is on the active weighing view
- WHEN the WebSocket connection drops or is interrupted
- THEN the system MUST display a persistent full-screen warning overlay blocking all touch interactions until the connection is restored

#### Scenario: Status indicator — connected

- GIVEN the operator is on the weighing panel
- WHEN `isConnected === true`
- THEN the status dot MUST be green (`bg-green-500`) and the label MUST read "Conectado"

#### Scenario: Status indicator — disconnected

- GIVEN the operator is on the weighing panel
- WHEN `isConnected === false`
- THEN the status dot MUST be amber (`bg-amber-500`) and the label MUST read "Sin señal"

#### Scenario: Register guard — connected

- GIVEN `isConnected === true`
- WHEN the operator taps "Registrar Muestra"
- THEN `handleRegistrarMuestra` MUST call `addSample(pesoNeto)` and the register button MUST NOT be disabled

#### Scenario: Register guard — disconnected

- GIVEN `isConnected === false`
- WHEN the register button is rendered
- THEN the button MUST be `disabled` and `handleRegistrarMuestra` MUST NOT call `addSample`

## REMOVED Requirements

### Requirement: isEstable as WebSocket contract field

The `BalanzaData` interface MUST NOT include `isEstable: boolean`.
The `useBalanzaWebSocket` hook MUST NOT return `isEstable`.
Consumers MUST NOT destructure `isEstable` from the hook.

(Reason: KRETZ scale always sends the last stable value; isEstable is perpetually true and carries no signal. Gating UI on it produces a permanently false "Balanza en movimiento..." state that never resolves.)
