export interface ToleranceLayout {
  /** Percentage position (0-100) where the tolerance range starts. */
  left: number;
  /** Percentage width (0-100) of the tolerance range. */
  width: number;
  /** Percentage position (0-100) of the ideal-weight cursor. */
  idealLeft: number;
}

/**
 * Computes the ±10%-of-span display window for the tolerance bar.
 * Given the stage's pesoMinimo/pesoIdeal/pesoMaximo, returns percentage
 * positions for the range start, range width, and the ideal-weight cursor,
 * padded by 10% of the span on each side.
 * Guards against a zero/negative span by centering everything at 50%.
 */
export const getToleranceLayout = (
  pesoMinimo: number,
  pesoIdeal: number,
  pesoMaximo: number,
): ToleranceLayout => {
  const span = pesoMaximo - pesoMinimo;

  if (span <= 0) {
    return { left: 50, width: 0, idealLeft: 50 };
  }

  const displayMin = pesoMinimo - 0.1 * span;
  const displayMax = pesoMaximo + 0.1 * span;
  const displayRange = displayMax - displayMin;

  const pct = (value: number) => ((value - displayMin) / displayRange) * 100;

  const left = pct(pesoMinimo);
  const width = pct(pesoMaximo) - left;
  const idealLeft = pct(pesoIdeal);

  return { left, width, idealLeft };
};
