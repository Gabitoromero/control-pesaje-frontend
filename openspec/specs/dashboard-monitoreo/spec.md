# Dashboard Monitoreo Specification

## Purpose
Provide supervisors with a real-time oversight dashboard displaying weighing lines status, live statistical deviations, and an interface for manual quality audits.

## Requirements

### Requirement: Real-time Multi-line Grid and Puesta a Punto
The system MUST render a real-time dashboard grid showcasing cards for up to 13 physical weighing lines. The system SHALL allow the supervisor to toggle any individual line into "Puesta a Punto" (setup/maintenance) mode, which prevents its data from affecting production KPIs.

#### Scenario: Live Grid Update
- GIVEN the supervisor is viewing the main dashboard
- WHEN weight telemetry is received concurrently from all 13 lines
- THEN the system MUST update each corresponding line card instantly without causing interface stutter or drop in responsiveness

#### Scenario: Toggle Setup Mode
- GIVEN a line card on the dashboard grid
- WHEN the supervisor toggles "Puesta a Punto"
- THEN the system MUST visually highlight the card as "En Puesta a Punto" and send a telemetry command to flag subsequent weights from this line as non-productive

### Requirement: Real-time Statistics and Deviation Charts
The system SHALL calculate and update the running average and standard deviation of weights reactively for each active line. The system MUST display these statistics in a live scatter chart.

#### Scenario: Reactive Statistical Calculations
- GIVEN a line with 3 registered weights: [100.0, 102.0, 98.0]
- WHEN a new weight of 100.0 is received
- THEN the system MUST instantly update the displayed average to 100.0 and the standard deviation to approximately 1.63

### Requirement: Random Quality Audit Sampling
The system MUST provide a quick-access interface to record random quality control samples. These samples SHALL support an optional article code and MUST NOT require any batch (lote) association.

#### Scenario: Save Random Quality Sample
- GIVEN the "Muestreo al Azar" modal is open
- WHEN the supervisor enters the weight, inputs an optional article ID, and clicks "Guardar"
- THEN the system MUST validate and persist the sample as a standalone quality audit log entry without a batch ID
