# Tablet Operario Pesaje Specification

## Purpose
Provide a touch-optimized interface for plant operators to execute sequential weighing batches, perform tara operations, increment daily lots, and locally manage sample discards while maintaining high resilience to connectivity failures.

## Requirements

### Requirement: Connectivity and Disconnect Protection
The system MUST establish a continuous WebSocket connection to the weight gateway telemetry. If the WebSocket connection drops, the system MUST immediately block the user interface with a full-screen overlay to prevent any incorrect manual input.

#### Scenario: Real-time Weight Streaming
- GIVEN the operator is on the active weighing view
- WHEN the WebSocket connection is active and broadcasting telemetry
- THEN the system MUST display the live weight on the digital scale visualizer in real time

#### Scenario: Connectivity Loss Lockout
- GIVEN the operator is on the active weighing view
- WHEN the WebSocket connection drops or is interrupted
- THEN the system MUST display a persistent full-screen warning overlay blocking all touch interactions until the connection is restored

### Requirement: Sequential Weighing and Tara Control
The system SHALL guide the operator through a sequential, step-by-step weighing process. The system MUST record a dedicated tara value for the container for each stage in the process before proceeding.

#### Scenario: Sequential Tara Registration
- GIVEN the operator is on stage 1 "Tara de Envase"
- WHEN the operator taps "Registrar Tara"
- THEN the system MUST save the current stable weight as the tara for that container and advance the UI to stage 2 "Pesaje Neto"

### Requirement: Autoincrementing Lots and Operario Session
The system MUST assign all measurements within a session to the logged-in operator. The system MUST generate a unique, autoincrementing daily batch (lote) code for each batch started in a 24-hour cycle.

#### Scenario: Automatic Daily Lot Generation
- GIVEN a logged-in operator starting the first batch of the day
- WHEN the operator taps "Iniciar Nuevo Lote"
- THEN the system MUST generate a batch code starting with sequence `1` (e.g., `LOTE-YYYYMMDD-01`) and lock it to the operator's session

### Requirement: Local Sample Discard
The system SHALL allow the operator to discard specific sample weights locally before final closure of the current batch.

#### Scenario: Local Measurement Discard
- GIVEN an active batch with multiple weight records
- WHEN the operator taps "Descartar Muestra" on a specific measurement in the list
- THEN the system MUST exclude that measurement from the local running average and flag it as discarded
