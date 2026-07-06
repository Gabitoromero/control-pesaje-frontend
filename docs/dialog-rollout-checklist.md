# Dialog & Notification System — Rollout Checklist

Tracks manual-QA coverage for the pilot phase of `dialog-notification-system`
and enumerates every remaining ad-hoc `window.confirm()` / `window.alert()` /
inline-error site left in the codebase for a future full-rollout SDD change.

Generated as part of PR 4/4 (final PR in the `dialog-notification-system`
chain). Re-verify this list before starting the follow-up rollout — pages
change over time and this snapshot may drift.

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

## Remaining Sites (NOT migrated — future rollout scope)

| Location | File | Current mechanism | Target type | Status | How to manually test |
|---|---|---|---|---|---|
| Delete muestra (tablet) | `src/features/tablet/components/MuestraObservacionPopup.tsx` (~L36) | `window.confirm('¿Está seguro de eliminar esta muestra?')` | N/A — see dedicated row below | Follow-up debt | See "Full modal rewrite" row below. |
| Inline activation error | `src/features/tablet/pages/SeleccionLineaPage.tsx` (~L44) | Local component state (`setActivarError`) rendered inline, not a native browser popup | `toast.error()` (non-blocking, tablet-friendly) | TODO | Attempt to activate an already-occupied línea from the tablet UI → an inline error message renders in the page today instead of a toast. |
| `DispositivosConectadosPage.tsx` | `src/features/dashboard/pages/DispositivosConectadosPage.tsx` | Verified clean — no `window.confirm`/`window.alert` found as of this PR | N/A | Verified, no action needed | Re-grep before rollout in case this changes. |

## Explicit Follow-Up Debt

| Location | File | Current mechanism | Target type | Status | How to manually test |
|---|---|---|---|---|---|
| Delete muestra popup | `src/features/tablet/components/MuestraObservacionPopup.tsx` | `window.confirm(...)` inside a fully custom popup component | Full modal rewrite (not a simple swap) — this component has its own bespoke popup/backdrop implementation that would need a structural rewrite to adopt `Dialog`/`AlertDialog`, not just a 1:1 `confirm()` call swap | Follow-up debt (explicitly out of scope for the whole `dialog-notification-system` pilot) | On the tablet UI, open a muestra observación popup and attempt delete → native browser confirm dialog appears today; the popup itself is not built on the new `Dialog`/`AlertDialog` primitives. |

## Notes for the Next Rollout SDD Change

- Re-run `grep -rn "window.confirm\|window.alert" frontend/src` before starting — this snapshot is current as of PR3 of the follow-up rollout (2026-07-06).
- After PR3, the only remaining native-dialog sites in scope for a future rollout are `SeleccionLineaPage.tsx` (inline-error-to-toast migration) and `MuestraObservacionPopup.tsx` (structural rewrite, explicit follow-up debt below). All `RutaFormPage`, `LineasPage`, `UsuariosPage`, and `EtapasPage` `window.confirm`/`window.alert` sites are migrated.
- `MuestraObservacionPopup.tsx` needs design/estimation time before touching — it is not a drop-in replacement like the other sites.
