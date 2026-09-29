/**
 * Guard for the "Registrar Muestra" action.
 *
 * Blocks registration only when the live weight falls outside the
 * admin-configured [pesoMinimo, pesoMaximo] range by more than a configurable
 * margin (`toleranciaPct`, an admin-editable global percentage) on each bound
 * — a weight already inside [pesoMinimo, pesoMaximo] is NEVER blocked,
 * regardless of how far it sits from pesoIdeal. Etapas with a legitimately
 * wide min/max spread (e.g. min far below ideal, max far above) must not get
 * blocked just because the value is far from the midpoint.
 *
 * Formula (factor = toleranciaPct / 100):
 *   lowerBound = pesoMinimo - factor * pesoMinimo
 *   upperBound = pesoMaximo + factor * pesoMaximo
 *   isBlocked  = pesoNeto < lowerBound || pesoNeto > upperBound
 *
 * Boundary semantics are strict (`<` / `>`): exactly at a bound does NOT
 * trigger the block.
 */
export const isToleranceBlocked = (
  pesoNeto: number,
  pesoMinimo: number,
  pesoMaximo: number,
  toleranciaPct: number,
): boolean => {
  const factor = toleranciaPct / 100;
  const lowerBound = pesoMinimo - factor * pesoMinimo;
  const upperBound = pesoMaximo + factor * pesoMaximo;
  return pesoNeto < lowerBound || pesoNeto > upperBound;
};

const pctFormatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formats a tolerance percentage for UI text using the es-AR locale (20 -> "20", 12.5 -> "12,5"). */
export const formatTolerancePct = (pct: number): string => pctFormatter.format(pct);
