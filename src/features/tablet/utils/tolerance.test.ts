import { describe, it, expect } from 'vitest';
import { isToleranceBlocked } from './tolerance';

describe('isToleranceBlocked', () => {
  it('blocks when tolerance exceeds 50% of ideal AND range is narrower than 100% of ideal', () => {
    // pesoIdeal=15, threshold=7.5, range=2 (< 15). pesoNeto=25 → tolerance=10 > 7.5.
    expect(isToleranceBlocked(25, 15, 14, 16)).toBe(true);
  });

  it('does NOT block at exactly 50% tolerance (boundary is strict >)', () => {
    // pesoIdeal=15, threshold=7.5, pesoNeto=22.5 → tolerance=7.5, NOT > 7.5.
    expect(isToleranceBlocked(22.5, 15, 14, 16)).toBe(false);
  });

  it('does NOT block when range is wider than 100% of ideal (admin range takes precedence)', () => {
    // pesoIdeal=15, range=20 (>= 15). Even with tolerance=10 (> 7.5), range wins.
    expect(isToleranceBlocked(25, 15, 5, 25)).toBe(false);
  });

  it('does NOT block at exactly 100% range (boundary is strict <)', () => {
    // pesoIdeal=10, 1.0*10=10, range=10 → NOT < 10. Even with tolerance=6 (>5).
    expect(isToleranceBlocked(16, 10, 5, 15)).toBe(false);
  });

  it('does NOT block when pesoIdeal is 0 (guards against divide-by-zero semantics)', () => {
    // pesoIdeal=0 → threshold=0, range=2. tolerance=5 > 0 true, but range < 0 false.
    expect(isToleranceBlocked(5, 0, -1, 1)).toBe(false);
  });

  it('blocks a real out-of-tolerance sample within a tight admin range', () => {
    // Real case: ideal=100, admin set min=99/max=101 (range=2, < 100). pesoNeto=160 → tolerance=60 > 50.
    expect(isToleranceBlocked(160, 100, 99, 101)).toBe(true);
  });
});
