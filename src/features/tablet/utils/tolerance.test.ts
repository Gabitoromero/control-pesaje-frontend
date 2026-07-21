import { describe, it, expect } from 'vitest';
import { isToleranceBlocked } from './tolerance';

describe('isToleranceBlocked', () => {
  it('blocks when tolerance exceeds 20% of ideal AND range is narrower than 40% of ideal', () => {
    // pesoIdeal=15, threshold=3, range=2 (< 6). pesoNeto=25 → tolerance=10 > 3.
    expect(isToleranceBlocked(25, 15, 14, 16)).toBe(true);
  });

  it('does NOT block at exactly 20% tolerance (boundary is strict >)', () => {
    // pesoIdeal=15, threshold=3, pesoNeto=18 → tolerance=3, NOT > 3.
    expect(isToleranceBlocked(18, 15, 14, 16)).toBe(false);
  });

  it('does NOT block when range is wider than 40% of ideal (admin range takes precedence)', () => {
    // pesoIdeal=15, range=10 (>= 6). Even with tolerance=10 (> 3), range wins.
    expect(isToleranceBlocked(25, 15, 10, 20)).toBe(false);
  });

  it('does NOT block at exactly 40% range (boundary is strict <)', () => {
    // pesoIdeal=10, 0.4*10=4, range=4 → NOT < 4. Even with tolerance=5 (>2).
    expect(isToleranceBlocked(15, 10, 8, 12)).toBe(false);
  });

  it('does NOT block when pesoIdeal is 0 (guards against divide-by-zero semantics)', () => {
    // pesoIdeal=0 → threshold=0, range=2. tolerance=5 > 0 true, but range < 0 false.
    expect(isToleranceBlocked(5, 0, -1, 1)).toBe(false);
  });

  it('blocks a real out-of-tolerance sample within a tight admin range', () => {
    // Real case: ideal=100, admin set min=99/max=101 (range=2, < 40). pesoNeto=130 → tolerance=30 > 20.
    expect(isToleranceBlocked(130, 100, 99, 101)).toBe(true);
  });
});
