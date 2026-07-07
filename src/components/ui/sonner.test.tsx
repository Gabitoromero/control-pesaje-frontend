import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { Toaster } from './sonner';
import { ThemeProvider } from '../../features/theme/ThemeContext';
import { mockMatchMedia } from '../../test/setup';

describe('Toaster (shadcn/Sonner source)', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    mockMatchMedia(false);

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
  });

  it('renders a live region and announces a triggered toast', async () => {
    render(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>
    );

    toast.success('Guardado con éxito');

    await waitFor(() => {
      expect(screen.getByText('Guardado con éxito')).toBeInTheDocument();
    });

    const liveRegion = document.querySelector('[aria-live]');
    expect(liveRegion).toBeInTheDocument();
  });

  it('reflects the active theme from useTheme() instead of a hardcoded value', async () => {
    localStorage.setItem('theme', 'dark');

    render(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>
    );

    toast.success('Tema oscuro');

    await waitFor(() => {
      const toaster = document.querySelector('[data-sonner-toaster]');
      expect(toaster).toHaveAttribute('data-sonner-theme', 'dark');
    });
  });

  it('reflects light theme when useTheme() resolves to light', async () => {
    localStorage.setItem('theme', 'light');

    render(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>
    );

    toast.success('Tema claro');

    await waitFor(() => {
      const toaster = document.querySelector('[data-sonner-toaster]');
      expect(toaster).toHaveAttribute('data-sonner-theme', 'light');
    });
  });
});
