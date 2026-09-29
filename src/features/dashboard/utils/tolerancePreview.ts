// Schematic stage used by the tolerance preview (not a real product stage).
export const PREVIEW_IDEAL = 100;
export const PREVIEW_MIN = 90;
export const PREVIEW_MAX = 110;

// Display window is fixed at ideal +/- 60% so a 50% margin stays visible.
const WINDOW_MARGIN_RATIO = 0.6;
const WINDOW_START = PREVIEW_IDEAL * (1 - WINDOW_MARGIN_RATIO);
const WINDOW_END = PREVIEW_IDEAL * (1 + WINDOW_MARGIN_RATIO);

export interface TolerancePreviewLayout {
  /** Horizontal positions and widths are percentages of the line, in [0, 100]. */
  idealLeft: number;
  bandLeft: number;
  bandWidth: number;
  /** Schematic marker positions: they do not represent real weights. */
  lowerBlockLeft: number;
  upperBlockLeft: number;
}

const clampPct = (value: number): number => Math.min(100, Math.max(0, value));

const toPosition = (weight: number): number =>
  clampPct(((weight - WINDOW_START) / (WINDOW_END - WINDOW_START)) * 100);

/**
 * Schematic layout: each block marker moves away from its green-band edge by
 * (toleranciaPct / 100) of the red zone on that side, so it is symmetric and
 * linear in the tolerance (50% -> midpoint of the red zone).
 */
export const getTolerancePreviewLayout = (toleranciaPct: number): TolerancePreviewLayout => {
  const factor = toleranciaPct / 100;
  const bandLeft = toPosition(PREVIEW_MIN);
  const bandRight = toPosition(PREVIEW_MAX);
  const lowerRedZone = bandLeft;
  const upperRedZone = 100 - bandRight;

  return {
    idealLeft: toPosition(PREVIEW_IDEAL),
    bandLeft,
    bandWidth: bandRight - bandLeft,
    lowerBlockLeft: clampPct(bandLeft - factor * lowerRedZone),
    upperBlockLeft: clampPct(bandRight + factor * upperRedZone),
  };
};
