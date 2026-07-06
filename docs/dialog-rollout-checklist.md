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

## Remaining Sites (NOT migrated — future rollout scope)

| Location | File | Current mechanism | Target type | Status | How to manually test |
|---|---|---|---|---|---|
| Delete ruta | `src/features/dashboard/pages/RutaFormPage.tsx` (~L219) | `window.confirm('¿Está seguro de eliminar esta ruta?')` | `useDialog().confirm()` (destructive) | TODO | Open a ruta, attempt delete → native browser confirm dialog appears today. |
| Reactivate ruta | `src/features/dashboard/pages/RutaFormPage.tsx` (~L225) | `window.confirm('¿Está seguro de reactivar esta ruta?')` | `useDialog().confirm()` | TODO | Reactivate an inactive ruta → native browser confirm appears today. |
| Delete last etapa in ruta builder | `src/features/dashboard/pages/RutaFormPage.tsx` (~L411) | `window.confirm("¿Esta seguro que desea eliminar la ultima etapa?...")` | `useDialog().confirm()` (destructive) | TODO | In the ruta etapa builder, remove the last etapa → native browser confirm appears today. |
| Close active session | `src/features/dashboard/pages/SesionesActivasPage.tsx` (~L99) | `window.confirm(...)` | `useDialog().confirm()` (destructive) | TODO | On Sesiones Activas, close a user's active session → native browser confirm appears today. |
| Delete artículo | `src/features/dashboard/pages/ArticulosPage.tsx` (~L141) | `window.confirm('¿Está seguro de eliminar este artículo?')` | `useDialog().confirm()` (destructive) | TODO | Note: ArticulosPage already has `alertError()` wired for mutation errors (pilot done), but its delete *confirmation* step was left as native `window.confirm()` — out of pilot scope. |
| Delete línea | `src/features/dashboard/pages/LineasPage.tsx` (~L188) | `window.confirm('¿Está seguro de eliminar esta línea?')` | `useDialog().confirm()` (destructive) | TODO | Note: LineasPage already has `alertSuccess()`/`alertWarning()` wired (pilot done), but delete *confirmation* was left as native `window.confirm()` — flagged during PR3 review, deferred on purpose. |
| Delete etapa | `src/features/dashboard/pages/EtapasPage.tsx` (~L140) | `window.confirm('¿Está seguro de eliminar esta etapa?')` | `useDialog().confirm()` (destructive) | TODO | Note: EtapasPage got the toast-success pilot (PR4) but delete confirmation was intentionally left as native `window.confirm()` per this PR's scope (confirm-before-delete flows stay blocking/out of scope). |
| Delete muestra (tablet) | `src/features/tablet/components/MuestraObservacionPopup.tsx` (~L36) | `window.confirm('¿Está seguro de eliminar esta muestra?')` | N/A — see dedicated row below | Follow-up debt | See "Full modal rewrite" row below. |
| Create/update/delete errors | `src/features/dashboard/pages/UsuariosPage.tsx` (L83-127, inline `isAxiosError` extraction + `alert(...)`) | `window.alert(...)` | `useDialog().alertError()` via `getApiErrorMessage()` | TODO | Trigger a failing create/update/delete for a usuario → native browser `alert()` popup appears today, not a styled dialog. Also noted in tasks as "refactor inline error extraction to `getApiErrorMessage`" — still pending. |
| Create/update/delete errors | `src/features/dashboard/pages/LineasPage.tsx` (L93-139, inline `isAxiosError` extraction + `alert(...)`) | `window.alert(...)` | `useDialog().alertError()` via `getApiErrorMessage()` | TODO | Trigger a failing create/update/delete for a línea → native browser `alert()` popup appears today. Note: LineasPage's *success/warning* path is already migrated (pilot); only its *error* path remains raw. |
| Update/delete errors | `src/features/dashboard/pages/EtapasPage.tsx` (L76-103, inline `isAxiosError` extraction + `alert(...)`) | `window.alert(...)` | `useDialog().alertError()` via `getApiErrorMessage()` | TODO | Trigger a failing update/delete for an etapa → native browser `alert()` popup appears today. Note: EtapasPage's *save-success* path is already migrated to `toast.success()` (this PR); only its *error* path remains raw. Also, `createMutation` on EtapasPage currently has no `onError` handler at all (silent failure) — worth fixing alongside the `alertError()` migration. |
| Inline activation error | `src/features/tablet/pages/SeleccionLineaPage.tsx` (~L44) | Local component state (`setActivarError`) rendered inline, not a native browser popup | `toast.error()` (non-blocking, tablet-friendly) | TODO | Attempt to activate an already-occupied línea from the tablet UI → an inline error message renders in the page today instead of a toast. |
| `DispositivosConectadosPage.tsx` | `src/features/dashboard/pages/DispositivosConectadosPage.tsx` | Verified clean — no `window.confirm`/`window.alert` found as of this PR | N/A | Verified, no action needed | Re-grep before rollout in case this changes. |

## Explicit Follow-Up Debt

| Location | File | Current mechanism | Target type | Status | How to manually test |
|---|---|---|---|---|---|
| Delete muestra popup | `src/features/tablet/components/MuestraObservacionPopup.tsx` | `window.confirm(...)` inside a fully custom popup component | Full modal rewrite (not a simple swap) — this component has its own bespoke popup/backdrop implementation that would need a structural rewrite to adopt `Dialog`/`AlertDialog`, not just a 1:1 `confirm()` call swap | Follow-up debt (explicitly out of scope for the whole `dialog-notification-system` pilot) | On the tablet UI, open a muestra observación popup and attempt delete → native browser confirm dialog appears today; the popup itself is not built on the new `Dialog`/`AlertDialog` primitives. |

## Notes for the Next Rollout SDD Change

- Re-run `grep -rn "window.confirm\|window.alert" frontend/src` before starting — this snapshot is current as of PR 4/4 of `dialog-notification-system` (2026-07-02).
- Prioritize the raw `alert()`-based error paths (Usuarios, Líneas, Etapas) since `alertError()` + `getApiErrorMessage()` is already proven and just needs wiring, same shape as the ArticulosPage pilot.
- `MuestraObservacionPopup.tsx` needs design/estimation time before touching — it is not a drop-in replacement like the other sites.
