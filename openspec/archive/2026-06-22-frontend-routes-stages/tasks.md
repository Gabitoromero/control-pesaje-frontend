# Tasks: Frontend Routes and Stages Management

## Phase 1: API and Interfaces Updates
| Task | Description | Status |
|------|-------------|--------|
| 1.1  | Update `Ruta` and `RutaCreate` interfaces in `api/rutas.ts` to include the `etapas` array. | ✅ Done |
| 1.2  | Update `api/rutas.ts` with required query and mutation hooks (`useCreateRuta`, `useUpdateRuta`, `useRuta`). | ✅ Done |

## Phase 2: Form Component Setup
| Task | Description | Status |
|------|-------------|--------|
| 2.1  | Create `RutaFormPage.tsx` under `features/dashboard/pages/`. Setup form state and schema. | ✅ Done |
| 2.2  | Add base inputs for `nombre` and `descripcion`. | ✅ Done |
| 2.3  | Use `useFieldArray` to setup the dynamic list for `etapas`. | ✅ Done |

## Phase 3: Stages Management UI
| Task | Description | Status |
|------|-------------|--------|
| 3.1  | Create an `EtapaRow` component (or inline it) to render Article, Stage, Weights, and Samples inputs. | ✅ Done |
| 3.2  | Implement Add, Remove, Move Up, and Move Down controls for the field array. | ✅ Done |

## Phase 4: Integration and Routing
| Task | Description | Status |
|------|-------------|--------|
| 4.1  | Update `router` configuration to register `/rutas/new` and `/rutas/:id`. | ✅ Done |
| 4.2  | Update `RutasPage.tsx` to link to the new pages instead of using the modal. Remove modal code. | ✅ Done |
| 4.3  | Connect form submit to `createRuta` and `updateRuta` mutations, and redirect on success. | ✅ Done |

## Review Workload Forecast
- **Chained PRs recommended**: No (small isolated feature)
- **400-line budget risk**: Medium (form might get large, but it's isolated)
- **Decision needed before apply**: No
