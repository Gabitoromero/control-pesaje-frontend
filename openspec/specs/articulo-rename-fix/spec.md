# Specification: articulo-rename-fix

## Purpose
Define the frontend requirements to propagate the backend `Articulo` entity field rename (`nombre` -> `codigo` and `marca` -> `nombre`), ensuring correct mapping, UI translations, and type-safety via backend symlink.

## Requirements

### Requirement: Shared Symlink and Interface Mapping
The frontend codebase MUST reference backend entity schemas for consistency.
- The `src/shared` symlink MUST point to `../codigo/backend/src/shared`.
- The `Articulo` interface MUST match the backend schema.
- The `ArticuloRutaPasadaItem` interface MUST match the backend schema.

| Interface | Field | Type | Description (Backend source) |
| :--- | :--- | :--- | :--- |
| `Articulo` | `codigo` | `string` | Formerly `nombre` (Code/ID) |
| `Articulo` | `nombre` | `string` (optional) | Formerly `marca` (Brand/Name) |
| `ArticuloRutaPasadaItem` | `articulo.codigo` | `string` | Nested article code |
| `ArticuloRutaPasadaItem` | `articulo.nombre` | `string` (optional) | Nested article brand name |

#### Scenario: Verify Articulo API schema matches backend
- GIVEN a compilation request of frontend typescript files
- WHEN compiling `src/api/articulos.ts` and `src/api/articulos-ruta.ts`
- THEN the TypeScript compiler resolves types against `src/shared/types/domain.ts`
- AND compilation completes without type errors for `Articulo` properties `codigo` and `nombre`

---

### Requirement: Articles Management UI and Literal Translation
The articles table, search toolbar, and forms MUST literally translate renamed fields.
- The field representing code (previously `nombre`) MUST be labeled "Código".
- The field representing brand/name (previously `marca`) MUST be labeled "Nombre".

| UI View | Control / Column | Literal Label | Mapped Field |
| :--- | :--- | :--- | :--- |
| Articles Table | Header Column 1 | "Código" | `articulo.codigo` |
| Articles Table | Header Column 2 | "Nombre" | `articulo.nombre` |
| Articles Form | Input Field | "Código" | `articulo.codigo` |
| Articles Form | Input Field | "Nombre" | `articulo.nombre` |
| Ruta Selection | Combobox Item | `[Código] Nombre` | Combined display |

#### Scenario: Displaying articles in the management table
- GIVEN the Articles administration view (`ArticulosPage`) is loaded
- WHEN the table renders a list of articles
- THEN the first column header displays "Código" showing the article's code
- AND the second column header displays "Nombre" showing the article's brand name

#### Scenario: Adding or editing an article
- GIVEN the Create/Edit article dialog modal is open
- WHEN the user fills out the form fields
- THEN the input label for the code field displays "Código" and maps to `codigo`
- AND the input label for the name/brand field displays "Nombre" and maps to `nombre`

#### Scenario: Selecting an article in Route setup
- GIVEN the Route setup page (`RutaFormPage`) is loaded
- WHEN rendering the list of available articles or selected items
- THEN each item is formatted as `[codigo] nombre`

---

### Requirement: Test Assertions and Mock Alignment
The frontend unit tests, integration tests, and MSW mocks MUST align with the renamed fields.
- MSW handler mock payloads MUST contain `codigo` and `nombre`.
- All test suites MUST assert the literal labels "Código" and "Nombre".

#### Scenario: Running component tests for Articles Page
- GIVEN the test suite for `ArticulosPage` is run
- WHEN rendering the page using MSW mocked articles containing `codigo` and `nombre`
- THEN the test asserts the presence of column headers "Código" and "Nombre"
- AND asserts form fields with labels "Código" and "Nombre" are present and editable
