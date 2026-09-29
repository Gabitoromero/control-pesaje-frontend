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

  it('at 0% the block markers sit exactly on min and max', () => {
    const layout = getTolerancePreviewLayout(0);
    expect(layout.lowerBlockValue).toBe(90);
    expect(layout.upperBlockValue).toBe(110);
    expect(layout.lowerBlockLeft).toBeCloseTo(layout.bandLeft, 5);
    expect(layout.upperBlockLeft).toBeCloseTo(layout.bandLeft + layout.bandWidth, 5);
  });

  it('at 20% the block values are min*(1-f) and max*(1+f)', () => {
    const layout = getTolerancePreviewLayout(20);
    expect(layout.lowerBlockValue).toBeCloseTo(72, 5);
    expect(layout.upperBlockValue).toBeCloseTo(132, 5);
    expect(layout.lowerBlockLeft).toBeCloseTo(((72 - 40) / 120) * 100, 5);
    expect(layout.upperBlockLeft).toBeCloseTo(((132 - 40) / 120) * 100, 5);
  });

  it('at 50% the lower marker is inside the window and the upper one is clamped to 100', () => {
    const layout = getTolerancePreviewLayout(50);
    expect(layout.lowerBlockValue).toBeCloseTo(45, 5);
    expect(layout.upperBlockValue).toBeCloseTo(165, 5);
    expect(layout.lowerBlockLeft).toBeCloseTo(((45 - 40) / 120) * 100, 5);
    expect(layout.upperBlockLeft).toBe(100);
  });

  it('clamps positions to [0, 100] for extreme values', () => {
    const layout = getTolerancePreviewLayout(500);
    expect(layout.lowerBlockLeft).toBe(0);
    expect(layout.upperBlockLeft).toBe(100);
  });

  it('a wider tolerance moves the markers outward', () => {
    const narrow = getTolerancePreviewLayout(10);
    const wide = getTolerancePreviewLayout(40);
    expect(wide.lowerBlockLeft).toBeLessThan(narrow.lowerBlockLeft);
    expect(wide.upperBlockLeft).toBeGreaterThan(narrow.upperBlockLeft);
  });
});
