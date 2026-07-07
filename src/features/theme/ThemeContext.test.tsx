import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { mockMatchMedia } from '../../test/setup';
import { ThemeProvider, useTheme } from './ThemeContext';
import { STORAGE_KEY } from './resolveTheme';

describe('ThemeContext', () => {
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
    mockMatchMedia(false);
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <ThemeProvider>{children}</ThemeProvider>;
  }

  it('useTheme throws when used outside ThemeProvider', () => {
    // Suppress React's expected error log for this negative-path test.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within a ThemeProvider'
    );
    spy.mockRestore();
  });

  it('initializes to dark by default when no stored value and no OS preference', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: Wrapper });
    expect(result.current.theme).toBe('dark');
  });

  it('initializes to the stored value when present', () => {
    mockStorage[STORAGE_KEY] = 'light';
    const { result } = renderHook(() => useTheme(), { wrapper: Wrapper });
    expect(result.current.theme).toBe('light');
  });

  it('initializes to dark when OS prefers dark and no stored value', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useTheme(), { wrapper: Wrapper });
    expect(result.current.theme).toBe('dark');
  });

  it('setTheme updates the theme, persists to localStorage, and toggles the .dark class', () => {
    mockStorage[STORAGE_KEY] = 'dark';
    const { result } = renderHook(() => useTheme(), { wrapper: Wrapper });

    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(mockStorage[STORAGE_KEY]).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
    expect(mockStorage[STORAGE_KEY]).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggleTheme flips the current theme and applies the same side effects', () => {
    mockStorage[STORAGE_KEY] = 'light';
    const { result } = renderHook(() => useTheme(), { wrapper: Wrapper });

    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(mockStorage[STORAGE_KEY]).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('light');
    expect(mockStorage[STORAGE_KEY]).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('still applies the theme and toggles the .dark class when localStorage.setItem throws', () => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => mockStorage[key] ?? null,
        setItem: () => {
          throw new Error('storage unavailable');
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

    const { result } = renderHook(() => useTheme(), { wrapper: Wrapper });

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
