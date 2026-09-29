// Illustrative stage used by the tolerance preview (not a real product stage).
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
  lowerBlockLeft: number;
  upperBlockLeft: number;
  /** Weights below/above which registration is blocked (unclamped). */
  lowerBlockValue: number;
  upperBlockValue: number;
}

const clampPct = (value: number): number => Math.min(100, Math.max(0, value));

const toPosition = (weight: number): number =>
  clampPct(((weight - WINDOW_START) / (WINDOW_END - WINDOW_START)) * 100);

export const getTolerancePreviewLayout = (toleranciaPct: number): TolerancePreviewLayout => {
  const factor = toleranciaPct / 100;
  const lowerBlockValue = PREVIEW_MIN * (1 - factor);
  const upperBlockValue = PREVIEW_MAX * (1 + factor);
  const bandLeft = toPosition(PREVIEW_MIN);
  const bandRight = toPosition(PREVIEW_MAX);

  return {
    idealLeft: toPosition(PREVIEW_IDEAL),
    bandLeft,
    bandWidth: bandRight - bandLeft,
    lowerBlockLeft: toPosition(lowerBlockValue),
    upperBlockLeft: toPosition(upperBlockValue),
    lowerBlockValue,
    upperBlockValue,
  };
};
