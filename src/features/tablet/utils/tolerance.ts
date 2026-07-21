/**
 * Guard for the "Registrar Muestra" action.
 *
 * Blocks registration when the live weight is far from the ideal AND the
 * admin's configured tolerance range is too tight to absorb that deviation.
 *
 * Formula:
 *   tolerance  = abs(pesoNeto - pesoIdeal)
 *   threshold  = 0.2 * pesoIdeal
 *   rangeWidth = pesoMaximo - pesoMinimo
 *   isBlocked  = tolerance > threshold AND rangeWidth < (2 * threshold)
 *
 * When `rangeWidth >= 2 * threshold` the admin's custom range already covers
 * the ±20% band, so the guard is unnecessary (the range takes precedence).
 *
 * Boundary semantics are strict (`>` and `<`): exactly 20% deviation or
 * exactly 40% range width do NOT trigger the block.
 */
export const isToleranceBlocked = (
  pesoNeto: number,
  pesoIdeal: number,
  pesoMinimo: number,
  pesoMaximo: number,
): boolean => {
  const threshold = 0.2 * pesoIdeal;
  const tolerance = Math.abs(pesoNeto - pesoIdeal);
  const rangeWidth = pesoMaximo - pesoMinimo;
  return tolerance > threshold && rangeWidth < 2 * threshold;
};
