/**
 * Guard for the "Registrar Muestra" action.
 *
 * Blocks registration only when the live weight falls outside the
 * admin-configured [pesoMinimo, pesoMaximo] range by more than a 20% margin
 * on each bound — a weight already inside [pesoMinimo, pesoMaximo] is NEVER
 * blocked, regardless of how far it sits from pesoIdeal. Etapas with a
 * legitimately wide min/max spread (e.g. min far below ideal, max far
 * above) must not get blocked just because the value is far from the
 * midpoint.
 *
 * Formula:
 *   lowerBound = pesoMinimo - 0.2 * pesoMinimo  (= 0.8 * pesoMinimo)
 *   upperBound = pesoMaximo + 0.2 * pesoMaximo  (= 1.2 * pesoMaximo)
 *   isBlocked  = pesoNeto < lowerBound || pesoNeto > upperBound
 *
 * Boundary semantics are strict (`<` / `>`): exactly at a bound does NOT
 * trigger the block.
 */
export const isToleranceBlocked = (
  pesoNeto: number,
  pesoMinimo: number,
  pesoMaximo: number,
): boolean => {
  const lowerBound = pesoMinimo - 0.2 * pesoMinimo;
  const upperBound = pesoMaximo + 0.2 * pesoMaximo;
  return pesoNeto < lowerBound || pesoNeto > upperBound;
};
