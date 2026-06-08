# Design: Gestion Admin Lists

## Technical Approach

The approach implements list views for administrative entities (Articulos, Etapas, Lineas, Rutas) by reusing the explicit React Query + HTML table + modal pattern established in `UsuariosPage.tsx`. The `DashboardLayout.tsx` will be restructured to group sidebar navigation into `Monitoreo`, `Planta`, `Gestión`, and `Reportes` headers, using the existing `UsuarioRol` and `useAuth` hook logic to ensure the `Gestión` section is strictly restricted to Admin users.

## Architecture Decisions

### Decision: Data Fetching and State Management

**Choice**: Use `useQuery` and `useMutation` from `@tanstack/react-query` individually inside each list component (e.g., `LineasPage.tsx`).
**Alternatives considered**: Create a generalized `useCrud` hook for all management pages or utilize generic Context providers.
**Rationale**: Adheres to the proposal's "Out of Scope" instruction against generic CRUD abstractions. Explicit `useQuery` definitions per component match the existing `UsuariosPage.tsx` precedent, maintain strong typing at the call site, and are easier to debug or customize individually later.

### Decision: Role Guarding Strategy in Layout

**Choice**: Inline conditional rendering based on the `user?.rol` property directly inside the `DashboardLayout` sidebar, wrapping the `Gestión` section grouping and its NavLinks.
**Alternatives considered**: Define a centralized, configuration-based routing object to dictate sidebar visibility.
**Rationale**: The `DashboardLayout` already uses inline booleans (`isJefe`, `isAdmin`, `isVisualizacion`). Adding section headers and applying `isAdmin` guards around the `Gestión` block is the most idiomatic, least invasive path and avoids over-engineering a static sidebar.

### Decision: Nested Relations Serialization Resilience

**Choice**: Utilize TypeScript optional chaining (`?.`) and null coalescing (`??`) extensively when mapping table cells (e.g., `<td>{linea.etapa?.nombre ?? '-'}</td>`).
**Alternatives considered**: Pre-process the API response in the `queryFn` to normalize null relations into default strings.
**Rationale**: Display logic belongs in the component view. Optional chaining is idiomatic in React 19/TypeScript, requires no extra mapping logic, and keeps the React Query cache identical to the raw backend response.

## Data Flow

    List Component (e.g., LineasPage)
         │   (useQuery / useMutation)
         ▼
    API Layer (e.g., src/api/lineas.ts)
         │   (fetch / axios)
         ▼
      Backend (GET/POST /lineas)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/layouts/DashboardLayout.tsx` | Modify | Reorganize into sections (Monitoreo, Planta, Gestión, Reportes). Restrict Gestión to `isAdmin`. |
| `frontend/src/App.tsx` | Modify | Add routes: `/dashboard/etapas`, `/dashboard/lineas`, `/dashboard/rutas`. Update `/dashboard/planta` to `<Navigate to="/tablet/seleccion-linea" />`. |
| `frontend/src/api/etapas.ts` | Create | CRUD functions and TypeScript interfaces for Etapas. |
| `frontend/src/api/lineas.ts` | Create | CRUD functions and TypeScript interfaces for Lineas. |
| `frontend/src/api/rutas.ts` | Create | CRUD functions and TypeScript interfaces for Rutas. |
| `frontend/src/api/usuarios.ts` | Modify | Update `Usuario` model to include `legajo`. |
| `frontend/src/api/articulos.ts` | Modify | Update `Articulo` model to include `marca`. |
| `frontend/src/features/dashboard/pages/EtapasPage.tsx` | Create | Table, React Query integration, and modal form for Etapas. |
| `frontend/src/features/dashboard/pages/LineasPage.tsx` | Create | Table, React Query integration, and modal form for Lineas. |
| `frontend/src/features/dashboard/pages/RutasPage.tsx` | Create | Table, React Query integration, and modal form for Rutas. |
| `frontend/src/features/dashboard/pages/ArticulosPage.tsx` | Modify | Update columns to include `marca`. |
| `frontend/src/features/dashboard/pages/UsuariosPage.tsx` | Modify | Update columns to include `legajo` and add to modal form if required. |

## Interfaces / Contracts

```typescript
// Example models in src/api/lineas.ts
export interface Etapa {
  id: number;
  nombre: string;
  activo?: boolean;
}

export interface Linea {
  id: number;
  nombre: string;
  etapaId: number;
  etapa?: Etapa; // Nullable/nested relation
  activo?: boolean;
}

export interface LineaCreate {
  nombre: string;
  etapaId: number;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Nested Object Handling | Ensure list pages do not crash when given mock data with `null` relationships (`etapa: null`). |
| Integration | Routing & Layout | Verify `Gestión` section and its routes are completely inaccessible for `UsuarioRol.OPERARIO` or `UsuarioRol.JEFE`. |
| E2E | CRUD Flow | Standard create/edit checks for new list pages using mocked API responses. |

## Migration / Rollout

No data migration required on the frontend. Ensure backend APIs (`/etapas`, `/lineas`, `/rutas`) are deployed and returning correct nested structures before deploying this frontend update.

## Open Questions

- [ ] Are there specific validation rules for `Etapas`, `Lineas`, and `Rutas` creation forms (e.g., minimum character length, alphanumeric only) that need enforcing on the frontend?
- [ ] Should the `/dashboard/planta` link use a standard React Router `<Navigate>` or a full browser redirect if `/tablet` is handled via a separate layout completely decoupled from `App.tsx` routes?
