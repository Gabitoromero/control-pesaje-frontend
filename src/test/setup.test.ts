import { describe, it, expect } from 'vitest';

describe('test environment setup', () => {
  it('provides a default window.matchMedia mock that does not throw', () => {
    expect(() => window.matchMedia('(prefers-color-scheme: dark)')).not.toThrow();
  });

  it('defaults matchMedia to matches: false with a full listener surface', () => {
    const result = window.matchMedia('(prefers-color-scheme: dark)');

    expect(result.matches).toBe(false);
    expect(typeof result.addEventListener).toBe('function');
    expect(typeof result.removeEventListener).toBe('function');
    expect(typeof result.addListener).toBe('function');
    expect(typeof result.removeListener).toBe('function');
    expect(typeof result.dispatchEvent).toBe('function');
  });
});
