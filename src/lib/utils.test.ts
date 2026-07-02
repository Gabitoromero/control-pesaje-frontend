import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins plain class name strings', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values (undefined/null/false)', () => {
    expect(cn('a', undefined, null, false, 'b')).toBe('a b');
  });

  it('merges conflicting Tailwind utility classes, keeping the last one', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('preserves existing semantic color utility classes untouched', () => {
    expect(cn('bg-brand text-danger', 'font-bold')).toBe('bg-brand text-danger font-bold');
  });
});
