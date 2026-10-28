export const VIEWPORT_MARGIN = 8;
export const INPUT_HEIGHT = 40;
export const LIST_MAX = 300;
export const LIST_MIN = 120;

/**
 * Decides where the options popover opens and how tall its list can be, so it
 * never goes past the viewport: below the trigger when it fits (or when there
 * is more room below than above), flipped above it otherwise.
 */
export const computePopoverPlacement = (rect: { top: number; bottom: number }, viewportHeight: number) => {
  const below = viewportHeight - rect.bottom - VIEWPORT_MARGIN;
  const above = rect.top - VIEWPORT_MARGIN;
  const side: 'top' | 'bottom' = below >= INPUT_HEIGHT + LIST_MIN || below >= above ? 'bottom' : 'top';
  const available = (side === 'bottom' ? below : above) - INPUT_HEIGHT;
  return { side, listMaxHeight: Math.max(LIST_MIN, Math.min(LIST_MAX, available)) };
};
