import { describe, it, expect } from 'vitest';
import { getToleranceLayout } from './toleranceRange';

describe('getToleranceLayout', () => {
  it('computes the ±10%-of-span window for a normal case', () => {
    const result = getToleranceLayout(10, 15, 20);

    expect(result.left).toBeCloseTo(8.333, 2);
    expect(result.width).toBeCloseTo(83.333, 2);
    expect(result.idealLeft).toBeCloseTo(50, 2);
  });

  it('centers the layout at 50% without dividing by zero when min === max', () => {
    const result = getToleranceLayout(10, 10, 10);

    expect(result.left).toBe(50);
    expect(result.width).toBe(0);
    expect(result.idealLeft).toBe(50);
  });
});
