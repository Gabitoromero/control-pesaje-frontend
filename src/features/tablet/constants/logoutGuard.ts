/**
 * Shared message used by the `GestionPasadasPage` logout confirmation dialog
 * (Task 3.7–3.9) and by the `beforeunload` handler that guards against
 * accidental reload/tab-close while a line session is active.
 *
 * Centralised so the in-app dialog and the native browser prompt stay in
 * sync — changing the wording here updates both surfaces at once.
 */
export const CONFIRM_LOGOUT_MESSAGE =
  'Tenés una sesión activa en esta línea. ¿Estás seguro de que querés salir? Se cerrará tu sesión.';