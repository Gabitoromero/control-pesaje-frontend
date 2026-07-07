import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { mockMatchMedia } from '../../test/setup';
import { ThemeProvider } from './ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { STORAGE_KEY } from './resolveTheme';

describe('ThemeToggle', () => {
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

  it('renders a toggle control', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls toggleTheme() from useTheme() when clicked', () => {
    mockStorage[STORAGE_KEY] = 'light';

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(screen.getByRole('button'));

    expect(mockStorage[STORAGE_KEY]).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('throws if rendered outside ThemeProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThemeToggle />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    );
    spy.mockRestore();
  });
});
