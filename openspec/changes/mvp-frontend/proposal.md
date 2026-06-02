# Proposal: MVP Frontend - Controlador de Pesaje

## Intent
Implementar el frontend modular (React/TS) para digitalizar el control de pesaje industrial. Reemplaza el registro manual por un flujo interactivo en planta y un monitoreo en tiempo real para supervisión y calidad.

## Scope

### In Scope
- Aplicación web modular con layouts dedicados (`TabletLayout` y `DashboardLayout`).
- Conectividad WebSocket para telemetría de balanza con bloqueo de pantalla por desconexión.
- Flujo secuencial de pesaje táctil, tara y descarte local de muestras.
- Grid en tiempo real con ~13 tarjetas físicas y gráficos estadísticos de dispersión.
- Exportación administrativa de reportes en formato Excel (.xlsx).

### Out of Scope
- Funcionalidades offline o almacenamiento local persistente de pesajes.
- Gestión de hardware o controladores físicos de balanzas (responsabilidad del backend/gateway).

## Capabilities

### New Capabilities
- `tablet-operario-pesaje`: Flujo en tablet táctil de planta con conexión continua WebSockets a telemetría de balanza, confirmación de peso, avance secuencial de etapas, tara por etapa, control de lotes diarios autoincrementales, operario único responsable y descarte local de muestras antes del cierre.
- `dashboard-monitoreo`: Grid en tiempo real para supervisores de las ~13 líneas físicas (con modo puesta a punto), gráficos de desviación de peso en vivo calculando promedio y desviación estándar, y registro preventivo de muestras al azar de calidad con artículo opcional y sin lote.
- `reports-export`: Descarga administrativa de reportes Excel (.xlsx) para rendimiento físico, trazabilidad de lotes y auditoría de inspectores de calidad.

## Approach
Implementación de arquitectura **Feature-Driven** (`src/features/{tablet,dashboard,reports}`) con desacoplamiento claro.
- Comunicaciones: Cliente Axios con JWT e interceptores de red estrictos.
- WebSocket encapsulado en hook técnico `useBalanzaWebSocket` con fallback visual.
- Gráficos estadísticos con cálculo reactivo de promedio y desviación estándar.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/` | New | Carpetas `tablet`, `dashboard`, y `reports`. |
| `src/components/` | New | Componentes UI (`WeightVisualizer`, `ControlChart`). |
| `src/services/` | New | Cliente WebSocket y exportador Excel. |
| `src/layouts/` | New | Layouts de Tablet y Dashboard. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Inestabilidad de red en planta | Alta | Bloqueo estricto de UI ante pérdida de WebSocket. |
| Lentitud en renderizado de 13 líneas | Media | Virtualización o memoización de componentes React. |

## Rollback Plan
Reversión a través de Git revirtiendo el commit raíz o la rama del feature y restableciendo el flujo manual de planillas del cliente.

## Dependencies
- Backend API REST y WebSockets operativos.
- Librería de gráficos y parser de Excel (`xlsx`).

## Success Criteria
- [ ] Conexión en tiempo real con balanza sin retraso perceptible.
- [ ] Carga exitosa del grid de supervisores con 13 líneas concurrentes.
- [ ] Exportación de reportes Excel con datos de trazabilidad correctos.
