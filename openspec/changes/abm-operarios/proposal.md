# Proposal: ABM de Operarios (Usuarios)

## Intent
Crear un ABM (Alta, Baja, Modificación) responsivo para la gestión de Operarios (Usuarios). El objetivo es reemplazar la tabla y el modal actuales, que no son responsivos, por una solución que ofrezca la mejor experiencia de usuario priorizando tablets (dispositivo principal), seguido por pantallas de escritorio y dispositivos móviles.

## Scope

### In Scope
- Refactorización de `UsuariosPage.tsx` para soportar renderizado condicional según el tamaño de la pantalla (breakpoints de Tailwind).
- Implementación de vista de Tabla para pantallas grandes (Desktop/Tablets en modo paisaje) y vista de Tarjetas (Cards) para pantallas más pequeñas (Tablets en modo retrato/Móviles).
- Creación o adaptación de modales/formularios responsivos para creación, edición y eliminación de operarios.
- Integración con el backend existente para operaciones CRUD de usuarios.

### Out of Scope
- Modificaciones en la estructura de la base de datos o lógica de autenticación/roles en el backend (a menos que haya un bug bloqueante).
- Refactorización global de otros módulos o ABMs (solo Operarios).

## Capabilities

### New Capabilities
- `operarios-responsive-ui`: Nueva interfaz responsiva que adapta el listado de operarios a tarjetas o tabla según el ancho del dispositivo (prioridad: tablet).

### Modified Capabilities
- `operarios-management`: Se modifica la vista de listado y los flujos de creación/edición para soportar los nuevos componentes responsivos.

## Approach
Se utilizará el "Enfoque B" (Responsive Cards + Table conditional rendering).
- **Prioridad Tablet:** Se emplearán las clases de Tailwind (`md:`, `lg:`) para que el punto de quiebre favorezca a las tablets. En tablets en orientación paisaje (`lg`), se mostrará la tabla; en orientación retrato y dispositivos menores (`md`, `sm`), se renderizarán tarjetas (Cards).
- El estado de la lista y las acciones CRUD se mantendrán centralizados, pasando los datos tanto al componente de Tabla como al de Tarjetas, renderizando solo el pertinente mediante clases `hidden md:block` o lógica de React.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/UsuariosPage.tsx` | Modified | Refactorización para soportar las vistas condicionales y los estados del ABM. |
| Componentes de Tabla | Modified/Removed | Ajustes a la tabla actual para ocultarla en pantallas pequeñas. |
| Nuevos Componentes (Cards) | New | Creación de las tarjetas para la vista en pantallas pequeñas. |
| Modales de ABM | Modified | Refactor de modales para asegurar responsividad en móviles y tablets. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Complejidad de mantenimiento por doble renderizado (Tabla y Cards) | Medium | Centralizar la lógica de estado y llamadas a la API en un hook o componente contenedor, inyectando solo props de renderizado a los componentes presentacionales. |
| Experiencia subóptima en breakpoints intermedios de tablet | Low | Pruebas exhaustivas usando DevTools emulando iPad/Tablets (768px a 1024px) para ajustar los breakpoints de Tailwind (`md`, `lg`) de forma precisa. |

## Rollback Plan
Revertir los commits de frontend relacionados con `UsuariosPage.tsx` y los componentes de UI. Al no alterar la lógica del backend ni la base de datos, el rollback es seguro y puramente visual.

## Dependencies
- Componentes base de UI existentes (Modales, Botones, Inputs).
- Endpoints del backend para ABM de usuarios (ya existentes).

## Success Criteria
- [ ] El ABM permite listar, crear, editar y eliminar operarios correctamente.
- [ ] En pantallas de tablet (paisaje) y escritorio, la lista se visualiza como una Tabla.
- [ ] En pantallas de tablet (retrato) y móviles, la lista se visualiza como un grid o stack de Tarjetas.
- [ ] La refactorización de `UsuariosPage.tsx` centraliza la lógica sin duplicar las llamadas a la API.
