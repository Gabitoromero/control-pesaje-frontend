import { describe, it, expect } from 'vitest';
import { isToleranceBlocked } from './tolerance';

describe('isToleranceBlocked', () => {
  it('does NOT block when pesoNeto is exactly pesoMinimo or pesoMaximo', () => {
    expect(isToleranceBlocked(10, 10, 20)).toBe(false);
    expect(isToleranceBlocked(20, 10, 20)).toBe(false);
  });

  it('does NOT block anywhere inside [pesoMinimo, pesoMaximo], even far from the midpoint', () => {
    // Wide admin-configured range (min far below, max far above the "center") —
    // must never block a value the admin already considers valid.
    expect(isToleranceBlocked(0.005, 0.003, 0.0065)).toBe(false);
  });

  it('does NOT block within the 20% margin below pesoMinimo', () => {
    // pesoMinimo=10 → lowerBound=8. pesoNeto=8 is not < 8.
    expect(isToleranceBlocked(8, 10, 20)).toBe(false);
  });

  it('does NOT block within the 20% margin above pesoMaximo', () => {
    // pesoMaximo=20 → upperBound=24. pesoNeto=24 is not > 24.
    expect(isToleranceBlocked(24, 10, 20)).toBe(false);
  });

  it('blocks below the 20%-under-pesoMinimo margin', () => {
    expect(isToleranceBlocked(7.9, 10, 20)).toBe(true);
  });

  it('blocks above the 20%-over-pesoMaximo margin', () => {
    expect(isToleranceBlocked(24.1, 10, 20)).toBe(true);
  });

  it('does NOT block when pesoMinimo and pesoMaximo are both 0 and pesoNeto matches', () => {
    expect(isToleranceBlocked(0, 0, 0)).toBe(false);
  });
});
