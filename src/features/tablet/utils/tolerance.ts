/**
 * Guard for the "Registrar Muestra" action.
 *
 * Blocks registration when the live weight deviates from pesoIdeal by more
 * than the allowed tolerance (20% of pesoIdeal), regardless of how the
 * admin configured pesoMinimo/pesoMaximo for the stage.
 *
 * Formula:
 *   threshold  = 0.2 * pesoIdeal
 *   deviation  = abs(pesoNeto - pesoIdeal)
 *   isBlocked  = deviation > threshold
 *
 * Boundary semantics are strict (`>`): exactly 20% deviation does NOT
 * trigger the block.
 */
export const isToleranceBlocked = (
  pesoNeto: number,
  pesoIdeal: number,
): boolean => {
  const threshold = 0.2 * pesoIdeal;
  const deviation = Math.abs(pesoNeto - pesoIdeal);
  return deviation > threshold;
};
