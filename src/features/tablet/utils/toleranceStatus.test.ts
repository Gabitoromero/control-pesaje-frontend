import { describe, it, expect } from 'vitest';
import { isWithinTolerance } from './toleranceStatus';

describe('isWithinTolerance', () => {
  it('returns true when pesoNeto is within the range', () => {
    expect(isWithinTolerance(15, 10, 20)).toBe(true);
  });

  it('returns false when pesoNeto is above pesoMaximo', () => {
    expect(isWithinTolerance(25, 10, 20)).toBe(false);
  });

  it('returns false when pesoNeto is below pesoMinimo', () => {
    expect(isWithinTolerance(5, 10, 20)).toBe(false);
  });

  it('returns true when pesoNeto equals pesoMinimo (inclusive)', () => {
    expect(isWithinTolerance(10, 10, 20)).toBe(true);
  });

  it('returns true when pesoNeto equals pesoMaximo (inclusive)', () => {
    expect(isWithinTolerance(20, 10, 20)).toBe(true);
  });
});
