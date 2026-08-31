import { describe, it, expect } from 'vitest';
import { isToleranceBlocked } from './tolerance';

describe('isToleranceBlocked', () => {
  it('does NOT block when pesoNeto equals pesoIdeal', () => {
    expect(isToleranceBlocked(15, 15)).toBe(false);
  });

  it('does NOT block within the 20% tolerance band', () => {
    // pesoIdeal=100, threshold=20 → [80, 120]. pesoNeto=115 → deviation=15, not > 20.
    expect(isToleranceBlocked(115, 100)).toBe(false);
  });

  it('does NOT block at exactly 20% deviation (boundary is strict >)', () => {
    // pesoIdeal=100, threshold=20 → deviation=20, NOT > 20.
    expect(isToleranceBlocked(120, 100)).toBe(false);
    expect(isToleranceBlocked(80, 100)).toBe(false);
  });

  it('blocks when deviation exceeds 20% of pesoIdeal (above)', () => {
    // pesoIdeal=100, threshold=20 → deviation=21 > 20.
    expect(isToleranceBlocked(121, 100)).toBe(true);
  });

  it('blocks when deviation exceeds 20% of pesoIdeal (below)', () => {
    expect(isToleranceBlocked(79, 100)).toBe(true);
  });

  it('does NOT block when pesoIdeal is 0 and pesoNeto matches exactly', () => {
    expect(isToleranceBlocked(0, 0)).toBe(false);
  });
});
