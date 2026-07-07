import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockMatchMedia } from '../../test/setup';
import { resolveTheme, STORAGE_KEY } from './resolveTheme';

describe('resolveTheme', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value.toString(); }),
        removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
        clear: vi.fn(() => { mockStorage = {}; }),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    mockMatchMedia(false);
  });

  it('resolves "light" when localStorage holds a valid stored "light" value', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    mockMatchMedia(true); // OS preference should be ignored when a stored value exists

    expect(resolveTheme()).toBe('light');
  });

  it('resolves "dark" when localStorage holds a valid stored "dark" value', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    mockMatchMedia(false);

    expect(resolveTheme()).toBe('dark');
  });

  it('resolves "dark" when no stored value and OS prefers dark', () => {
    mockMatchMedia(true);

    expect(resolveTheme()).toBe('dark');
  });

  it('resolves "dark" (default) when no stored value and OS has no dark preference', () => {
    mockMatchMedia(false);

    expect(resolveTheme()).toBe('dark');
  });

  it('resolves "dark" (default) when matchMedia is unsupported', () => {
    const original = window.matchMedia;
    // @ts-expect-error -- simulate an environment without matchMedia support
    delete window.matchMedia;

    expect(resolveTheme()).toBe('dark');

    window.matchMedia = original;
  });

  it('treats a corrupt/invalid stored value as absent and falls through to OS/default', () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-real-theme');
    mockMatchMedia(true);

    expect(resolveTheme()).toBe('dark');

    mockMatchMedia(false);
    expect(resolveTheme()).toBe('dark');
  });
});
