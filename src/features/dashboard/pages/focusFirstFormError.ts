const PULSE_COLOR = 'hsl(var(--destructive))';
const PULSE_GLOW = 'hsl(var(--destructive) / 0.6)';
const PULSE_TINT = 'hsl(var(--destructive) / 0.25)';

const PULSE_KEYFRAMES: Keyframe[] = [
  { boxShadow: '0 0 0 0 transparent', backgroundColor: 'transparent' },
  {
    boxShadow: `0 0 0 4px ${PULSE_COLOR}, 0 0 16px 4px ${PULSE_GLOW}`,
    backgroundColor: PULSE_TINT,
  },
  { boxShadow: '0 0 0 0 transparent', backgroundColor: 'transparent' },
];

const PULSE_OPTIONS: KeyframeAnimationOptions = { duration: 500, iterations: 3, easing: 'ease-in-out' };

// react-hook-form leaves are objects carrying `type` (and usually `message`/`ref`); anything else is a container.
const isFieldError = (value: unknown): boolean =>
  typeof value === 'object' && value !== null && 'type' in value && typeof (value as { type: unknown }).type === 'string';

const collectErrorPaths = (errors: unknown, prefix = ''): string[] => {
  if (typeof errors !== 'object' || errors === null) return [];
  if (prefix && isFieldError(errors)) return [prefix];
  return Object.entries(errors).flatMap(([key, child]) =>
    key === 'ref' ? [] : collectErrorPaths(child, prefix ? `${prefix}.${key}` : key),
  );
};

/**
 * Scrolls to the first (in page order) element tagged `data-field="<path>"` whose path has a
 * form error, and pulses it three times. Returns the targeted element, or null if none matched.
 */
export const focusFirstFormError = (errors: unknown, root: ParentNode = document): HTMLElement | null => {
  const paths = new Set(collectErrorPaths(errors));
  const target = Array.from(root.querySelectorAll<HTMLElement>('[data-field]')).find((el) =>
    paths.has(el.dataset.field ?? ''),
  );
  if (!target) return null;

  target.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  target.querySelector<HTMLElement>('input, button')?.focus({ preventScroll: true });
  if (target instanceof HTMLInputElement) target.focus({ preventScroll: true });
  target.animate?.(PULSE_KEYFRAMES, PULSE_OPTIONS);
  return target;
};
