# Dialog & Notification System — Rollout Checklist

Tracks manual-QA coverage for the `dialog-notification-system` rollout, which
replaced every ad-hoc `window.confirm()` / `window.alert()` / inline-error
site in the codebase with the shared `Dialog`/`AlertDialog`/toast system.

**Rollout status: COMPLETE.** PR4 (final PR in the chain) migrated the last
2 remaining sites. `rg -n "window\.confirm|window\.alert" src` (excluding
test files) returns zero matches anywhere in `src/` as of this PR.

## Pilot Sites (DONE)

| Location | File | Dialog/Toast type | Status | How to manually verify |
|---|---|---|---|---|
| Delete user confirmation | `src/features/dashboard/pages/UsuariosPage.tsx` | `useDialog().confirm()` (blocking, destructive variant) | DONE | Go to Usuarios, click the trash icon on any row → a modal (not a native browser confirm) appears with "Cancelar"/destructive confirm buttons; Escape or Cancel leaves the user untouched. |
| Mutation error surfacing | `src/features/dashboard/pages/ArticulosPage.tsx` | `useDialog().alertError()` (blocking) | DONE | Trigger a failing create/update/delete (e.g. delete an artículo referenced by a línea) → a modal shows the backend's error message via `getApiErrorMessage()`. |
| Success/warning outcome | `src/features/dashboard/pages/LineasPage.tsx` | `useDialog().alertSuccess()` / `alertWarning()` (blocking) | DONE | Create or edit a línea with a `ruta` assigned → success dialog; without a `ruta` → warning dialog. Click "Activar Línea" on an inactive línea → dialog copy says "activada", not "actualizada". |
| Save success feedback | `src/features/dashboard/pages/EtapasPage.tsx` | `toast.success()` (Sonner, non-blocking) | DONE | Edit/save an etapa → a non-blocking toast ("Etapa actualizada exitosamente") appears in the corner without blocking the UI; create a new etapa → "Etapa creada exitosamente"; click "Activar Etapa" on an inactive etapa → "Etapa activada exitosamente". |
| Delete artículo | `src/features/dashboard/pages/ArticulosPage.tsx` | `useDialog().confirm()` (blocking, destructive variant) | DONE (migrated in PR2, previously mislabeled TODO below — corrected here) | Go to Artículos, click "Eliminar Artículo" in the edit modal → a modal appears instead of the native browser confirm. |
| Close active session | `src/features/dashboard/pages/SesionesActivasPage.tsx` | `useDialog().confirm()` / `alertError()` (blocking) | DONE (migrated in PR2, previously mislabeled TODO below — corrected here) | On Sesiones Activas, close a user's active session → a modal appears instead of the native browser confirm. |

## PR3 Sites (DONE)

| Location | File | Dialog/Toast type | Status | How to manually verify |
|---|---|---|---|---|
| Delete ruta | `src/features/dashboard/pages/RutaFormPage.tsx` | `useDialog().confirm()` (blocking, destructive variant) | DONE | Open a ruta, click "Eliminar Ruta" → a modal (not a native browser confirm) appears with "Cancelar"/destructive "Eliminar" buttons. |
| Reactivate ruta | `src/features/dashboard/pages/RutaFormPage.tsx` | `useDialog().confirm()` (blocking, default variant) | DONE | Reactivate an inactive ruta → a modal appears asking for confirmation instead of the native browser confirm. |
| Delete last etapa in ruta builder | `src/features/dashboard/pages/RutaFormPage.tsx` | `useDialog().confirm()` (blocking, destructive variant) | DONE | In the ruta etapa builder, remove the last etapa → a modal appears instead of the native browser confirm. |
| Save/add/remove errors (ruta + articulos pivot) | `src/features/dashboard/pages/RutaFormPage.tsx` | `useDialog().alertError()` (blocking) | DONE | Trigger a failing create/update/add-articulo/remove-articulo/delete → a modal shows the backend's error message via `getApiErrorMessage()`; delete-ruta failure keeps the "Nota de sistema" detail. |
| Delete línea | `src/features/dashboard/pages/LineasPage.tsx` | `useDialog().confirm()` (blocking, destructive variant) | DONE | Go to Líneas, click "Eliminar Línea" → a modal appears instead of the native browser confirm. |
| Create/update/delete errors | `src/features/dashboard/pages/LineasPage.tsx` | `useDialog().alertError()` via `getApiErrorMessage()` (blocking) | DONE | Trigger a failing create/update/delete for a línea → a modal shows the backend's error message instead of a native `alert()`. Success/warning path (pilot) is unaffected. |
| Delete usuario errors + inline extraction removal | `src/features/dashboard/pages/UsuariosPage.tsx` | `useDialog().alertError()` via `getApiErrorMessage()` (blocking) | DONE | Trigger a failing create/update/delete for a usuario → a modal shows the backend's error message; the old inline `isAxiosError` extraction was removed. Delete *confirmation* was already migrated in a prior PR. |
| Delete etapa | `src/features/dashboard/pages/EtapasPage.tsx` | `useDialog().confirm()` (blocking, destructive variant) | DONE | Go to Etapas, click "Eliminar Etapa" → a modal appears instead of the native browser confirm. |
| Save/delete errors + missing create onError | `src/features/dashboard/pages/EtapasPage.tsx` | `useDialog().alertError()` via `getApiErrorMessage()` (blocking) | DONE | Trigger a failing create/update/delete for an etapa → a modal shows the backend's error message; delete failure keeps the "Nota de sistema" detail. `createMutation` previously had no `onError` at all (silent failure on create) — now fixed. Toast-success path (pilot) is unaffected. |

## PR4 Sites (DONE)

| Location | File | Dialog/Toast type | Status | How to manually verify |
|---|---|---|---|---|
| Delete muestra (tablet) | `src/features/tablet/components/MuestraObservacionPopup.tsx` (~L36) | `useDialog().confirm()` (blocking, destructive variant) | DONE | On the tablet UI, open a muestra observación popup and click "Eliminar" → the shared `AlertDialog` (role `alertdialog`) appears instead of the native browser confirm, with "Cancelar"/destructive "Eliminar" buttons. |
| Inline activation error | `src/features/tablet/pages/SeleccionLineaPage.tsx` (~L44) | `toast.error()` (non-blocking, tablet-friendly, Sonner) | DONE | Attempt to activate an already-occupied línea from the tablet UI → a non-blocking toast appears in the corner (409 → backend message or "Línea ocupada"; other errors → "Error al activar la línea") instead of the old inline error block. |
| `DispositivosConectadosPage.tsx` | `src/features/dashboard/pages/DispositivosConectadosPage.tsx` | Verified clean — no `window.confirm`/`window.alert` found | N/A | Verified, no action needed. |

## Notes

- Re-run `rg -n "window\.confirm|window\.alert" src` (excluding test files) before any future change — this snapshot is current as of PR4, the final PR of the `dialog-notification-system` rollout (2026-07-06). It returns zero matches.
- The rollout is now fully complete: `RutaFormPage`, `LineasPage`, `UsuariosPage`, `EtapasPage` (PR2/PR3), and `SeleccionLineaPage`/`MuestraObservacionPopup` (PR4) have all been migrated off native `window.confirm`/`window.alert`/inline-error state.
- **Correction to a prior estimate**: PR3's notes flagged `MuestraObservacionPopup.tsx` as needing a "full modal rewrite" because it has its own bespoke popup/backdrop implementation rather than being built on the shared `Dialog`/`AlertDialog` primitive. That turned out to be an overestimate. Since `DialogProvider` already wraps the whole app in `main.tsx`, `useDialog()` is available from any component tree, custom modal or not — no structural changes were needed. The actual fix was the same shape as `ArticulosPage.tsx`'s `handleDelete` (which also nests a `confirm()` call inside its own custom `fixed inset-0` modal): swap `window.confirm(...)` for `await confirm({ title, confirmText, cancelText, variant: 'destructive' })`, a ~6-line diff. Lesson: a component being a "custom modal" (not built on `Dialog`) does not imply it needs a structural rewrite to use `useDialog()` — the hook only needs a `DialogProvider` ancestor, which was already global.
