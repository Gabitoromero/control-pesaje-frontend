import { describe, it, expect } from 'vitest';
// @ts-expect-error -- plain JS config file, no type declarations published.
import tailwindConfig from '../../tailwind.config.js';

describe('tailwind.config.js theming', () => {
  const colors = tailwindConfig.theme?.extend?.colors as Record<string, unknown>;

  it('keeps all pre-existing semantic color tokens untouched (no visual regression)', () => {
    expect(colors.brand).toEqual({
      DEFAULT: '#06b6d4',
      hover: '#22d3ee',
      muted: 'rgb(6 182 212 / 0.1)',
      light: '#0891b2',
      'light-bg': '#ecfeff',
    });
    expect(colors.surface).toEqual({
      'dark-primary': '#09090b',
      'dark-secondary': '#18181b',
      'dark-tertiary': '#27272a',
      'light-primary': '#fafafa',
      'light-secondary': '#ffffff',
      'light-tertiary': '#f4f4f5',
    });
    expect(colors.success).toEqual({ DEFAULT: '#10b981', muted: 'rgb(16 185 129 / 0.1)' });
    expect(colors.danger).toEqual({ DEFAULT: '#ef4444', muted: 'rgb(239 68 68 / 0.1)' });
    expect(colors.warning).toEqual({ DEFAULT: '#f59e0b', muted: 'rgb(245 158 11 / 0.1)' });
  });

  it('adds shadcn/ui CSS-variable-driven color tokens without hardcoded hex values', () => {
    const shadcnTokens = [
      'background',
      'foreground',
      'card',
      'popover',
      'primary',
      'secondary',
      'muted',
      'accent',
      'destructive',
      'border',
      'input',
      'ring',
    ];
    for (const token of shadcnTokens) {
      expect(colors[token], `expected colors.${token} to be defined`).toBeDefined();
    }
    // Spot-check a couple of tokens actually reference CSS custom properties.
    expect(JSON.stringify(colors.primary)).toContain('var(--primary)');
    expect(JSON.stringify(colors.destructive)).toContain('var(--destructive)');
  });

  it('enables class-based dark mode and the tailwindcss-animate plugin', () => {
    expect(tailwindConfig.darkMode).toEqual(['class']);
    expect(tailwindConfig.plugins?.length).toBeGreaterThan(0);
  });

  it('maps borderRadius to the --radius CSS variable', () => {
    const borderRadius = tailwindConfig.theme?.extend?.borderRadius as Record<string, string>;
    expect(borderRadius.lg).toBe('var(--radius)');
  });
});
