import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { STORAGE_KEY } from './resolveTheme';

/**
 * Extracts the inline FOUC-prevention script from index.html and runs it
 * against the real jsdom `document`/`localStorage`, so drift between the
 * hand-mirrored script and `resolveTheme.ts` is caught automatically instead
 * of relying on manual review (see index.html's "keep in sync" comment).
 */
function runFoucScript(): void {
  const html = readFileSync(resolve(__dirname, '../../../index.html'), 'utf-8');
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error('Could not find inline FOUC script in index.html');
  }
  new Function(match[1])();
}

describe('index.html FOUC script', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => mockStorage[key] ?? null,
        setItem: (key: string, value: string) => {
          mockStorage[key] = value.toString();
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
        clear: () => {
          mockStorage = {};
        },
      },
      writable: true,
      configurable: true,
    });
    document.documentElement.classList.remove('dark');
  });

  it('applies dark when no stored value is present', () => {
    runFoucScript();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applies dark when the stored value is "dark"', () => {
    mockStorage[STORAGE_KEY] = 'dark';
    runFoucScript();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('does NOT apply dark when the stored value is exactly "light"', () => {
    mockStorage[STORAGE_KEY] = 'light';
    runFoucScript();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('applies dark when the stored value is corrupted/invalid', () => {
    mockStorage[STORAGE_KEY] = 'not-a-real-theme';
    runFoucScript();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applies dark (fail-safe default) when localStorage access throws', () => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('storage unavailable');
      },
      configurable: true,
    });
    runFoucScript();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
