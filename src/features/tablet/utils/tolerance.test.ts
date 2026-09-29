import { describe, it, expect } from 'vitest';
import { isToleranceBlocked, formatTolerancePct } from './tolerance';

describe('isToleranceBlocked', () => {
  it('does NOT block when pesoNeto is exactly pesoMinimo or pesoMaximo', () => {
    expect(isToleranceBlocked(10, 10, 20, 20)).toBe(false);
    expect(isToleranceBlocked(20, 10, 20, 20)).toBe(false);
  });

  it('does NOT block anywhere inside [pesoMinimo, pesoMaximo], even far from the midpoint', () => {
    // Wide admin-configured range (min far below, max far above the "center") —
    // must never block a value the admin already considers valid.
    expect(isToleranceBlocked(0.005, 0.003, 0.0065, 20)).toBe(false);
  });

  it('does NOT block within the 20% margin below pesoMinimo', () => {
    // pesoMinimo=10 → lowerBound=8. pesoNeto=8 is not < 8.
    expect(isToleranceBlocked(8, 10, 20, 20)).toBe(false);
  });

  it('does NOT block within the 20% margin above pesoMaximo', () => {
    // pesoMaximo=20 → upperBound=24. pesoNeto=24 is not > 24.
    expect(isToleranceBlocked(24, 10, 20, 20)).toBe(false);
  });

  it('blocks below the 20%-under-pesoMinimo margin', () => {
    expect(isToleranceBlocked(7.9, 10, 20, 20)).toBe(true);
  });

  it('blocks above the 20%-over-pesoMaximo margin', () => {
    expect(isToleranceBlocked(24.1, 10, 20, 20)).toBe(true);
  });

  it('does NOT block when pesoMinimo and pesoMaximo are both 0 and pesoNeto matches', () => {
    expect(isToleranceBlocked(0, 0, 0, 20)).toBe(false);
  });

  describe('configurable percentage', () => {
    it('0%: blocks just outside [min, max] and allows anything inside', () => {
      expect(isToleranceBlocked(9.99, 10, 20, 0)).toBe(true);
      expect(isToleranceBlocked(20.01, 10, 20, 0)).toBe(true);
      expect(isToleranceBlocked(10, 10, 20, 0)).toBe(false);
      expect(isToleranceBlocked(15, 10, 20, 0)).toBe(false);
      expect(isToleranceBlocked(20, 10, 20, 0)).toBe(false);
    });

    it('10%: min=100/max=200 -> limits 90 and 220', () => {
      expect(isToleranceBlocked(85, 100, 200, 10)).toBe(true);
      expect(isToleranceBlocked(90, 100, 200, 10)).toBe(false);
      expect(isToleranceBlocked(220, 100, 200, 10)).toBe(false);
      expect(isToleranceBlocked(221, 100, 200, 10)).toBe(true);
    });

    it('50%: the same weight blocked at 20% is allowed', () => {
      // min=10 -> 20% limit 8, 50% limit 5
      expect(isToleranceBlocked(6, 10, 20, 20)).toBe(true);
      expect(isToleranceBlocked(6, 10, 20, 50)).toBe(false);
      expect(isToleranceBlocked(4.9, 10, 20, 50)).toBe(true);
      // max=20 -> 50% limit 30
      expect(isToleranceBlocked(30, 10, 20, 50)).toBe(false);
      expect(isToleranceBlocked(30.1, 10, 20, 50)).toBe(true);
    });
  });
});

describe('formatTolerancePct', () => {
  it('formats integers without decimals', () => {
    expect(formatTolerancePct(20)).toBe('20');
    expect(formatTolerancePct(0)).toBe('0');
  });

  it('uses the es-AR decimal comma', () => {
    expect(formatTolerancePct(12.5)).toBe('12,5');
  });

  it('rounds to at most 2 decimals', () => {
    expect(formatTolerancePct(12.345)).toBe('12,35');
  });
});
