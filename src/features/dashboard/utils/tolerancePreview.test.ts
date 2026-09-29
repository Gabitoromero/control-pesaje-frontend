import { describe, it, expect } from 'vitest';
import { getTolerancePreviewLayout, PREVIEW_IDEAL, PREVIEW_MIN, PREVIEW_MAX } from './tolerancePreview';

// Illustrative stage: ideal 100, min 90, max 110, window [40, 160].
describe('getTolerancePreviewLayout', () => {
  it('exposes the illustrative stage', () => {
    expect([PREVIEW_IDEAL, PREVIEW_MIN, PREVIEW_MAX]).toEqual([100, 90, 110]);
  });

  it('centers the ideal marker and places the min/max band around it', () => {
    const layout = getTolerancePreviewLayout(20);
    expect(layout.idealLeft).toBeCloseTo(50, 5);
    expect(layout.bandLeft).toBeCloseTo((50 / 120) * 100, 5); // 90 -> 41.67%
    expect(layout.bandWidth).toBeCloseTo((20 / 120) * 100, 5); // 90..110 -> 16.67%
  });

  it.each([
    [0, 0],
    [12.5, 0.125],
    [20, 0.2],
    [25, 0.25],
    [50, 0.5],
  ])('at %s%% each marker travels a %s fraction of its red zone', (pct, fraction) => {
    const layout = getTolerancePreviewLayout(pct);
    const bandRight = layout.bandLeft + layout.bandWidth;
    const lowerRedZone = layout.bandLeft;
    const upperRedZone = 100 - bandRight;

    expect(layout.lowerBlockLeft).toBeCloseTo(layout.bandLeft - fraction * lowerRedZone, 5);
    expect(layout.upperBlockLeft).toBeCloseTo(bandRight + fraction * upperRedZone, 5);
  });

  it('at 50% each marker sits at the midpoint of its red zone', () => {
    const layout = getTolerancePreviewLayout(50);
    const bandRight = layout.bandLeft + layout.bandWidth;

    expect(layout.lowerBlockLeft).toBeCloseTo(layout.bandLeft / 2, 5);
    expect(layout.upperBlockLeft).toBeCloseTo(bandRight + (100 - bandRight) / 2, 5);
  });

  it('travels the same distance on both sides', () => {
    for (const pct of [5, 12.5, 30, 50]) {
      const layout = getTolerancePreviewLayout(pct);
      const bandRight = layout.bandLeft + layout.bandWidth;
      expect(layout.bandLeft - layout.lowerBlockLeft).toBeCloseTo(layout.upperBlockLeft - bandRight, 5);
    }
  });

  it('grows linearly with the tolerance', () => {
    const at = (pct: number) => getTolerancePreviewLayout(pct).upperBlockLeft;
    expect(at(20) - at(10)).toBeCloseTo(at(40) - at(30), 5);
  });

  it('does not expose real block weights (schematic preview)', () => {
    const layout = getTolerancePreviewLayout(20);
    expect(layout).not.toHaveProperty('lowerBlockValue');
    expect(layout).not.toHaveProperty('upperBlockValue');
  });

  it('clamps positions to [0, 100] for out-of-range input', () => {
    const layout = getTolerancePreviewLayout(500);
    expect(layout.lowerBlockLeft).toBe(0);
    expect(layout.upperBlockLeft).toBe(100);
    expect(getTolerancePreviewLayout(-500).lowerBlockLeft).toBeLessThanOrEqual(100);
  });

  it('a wider tolerance moves the markers outward', () => {
    const narrow = getTolerancePreviewLayout(10);
    const wide = getTolerancePreviewLayout(40);
    expect(wide.lowerBlockLeft).toBeLessThan(narrow.lowerBlockLeft);
    expect(wide.upperBlockLeft).toBeGreaterThan(narrow.upperBlockLeft);
  });
});
