# Apply Progress: Frontend Routes Stages

## What was done
1. Installed `react-hook-form` and `@hookform/resolvers` via `npm install`.
2. Updated `api/rutas.ts` to include the new `RutaPasadaEtapa` interface and updated `Ruta` and `RutaCreate`.
3. Created `RutaFormPage.tsx` using `react-hook-form` with `zod` validation and `useFieldArray` for dynamic stage rows.
4. Added UI controls to add, remove, and swap (move up/down) stage items.
5. Wired up `RutaFormPage` to existing API functions `createRuta` and `updateRuta`, returning the user to `/dashboard/rutas` on success.
6. Refactored `RutasPage.tsx` to remove the inline modal, instead adding `navigate` hooks to go to `/rutas/new` and `/rutas/:id`.
7. Updated `App.tsx` routes to mount `RutaFormPage`.

## Validation & Results
- Form properly handles adding blank stages.
- Order is dynamically calculated based on array position on submit.
- Empty fields show validation errors through Zod.
