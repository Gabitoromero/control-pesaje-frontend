/**
 * Determines whether a net weight reading falls within the stage's
 * tolerance range (inclusive of both bounds).
 */
export const isWithinTolerance = (
  pesoNeto: number,
  pesoMinimo: number,
  pesoMaximo: number,
): boolean => pesoNeto >= pesoMinimo && pesoNeto <= pesoMaximo;
