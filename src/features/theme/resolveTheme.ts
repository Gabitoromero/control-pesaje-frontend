// MIRRORED by inline <script> in index.html — keep in sync.

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export type Theme = (typeof THEME)[keyof typeof THEME];

export const STORAGE_KEY = 'theme';

function isValidTheme(value: unknown): value is Theme {
  return value === THEME.LIGHT || value === THEME.DARK;
}

/**
 * Resolution order:
 * 1. Valid stored `localStorage` value ('light' | 'dark') wins.
 * 2. Else, OS `prefers-color-scheme: dark` -> 'dark'.
 * 3. Else (no stored value, no/undetectable dark OS preference) -> 'dark' (default).
 *
 * Never silently defaults to 'light'. Guarded with try/catch since
 * localStorage/matchMedia access can throw in restrictive environments.
 */
export function resolveTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isValidTheme(stored)) {
      return stored;
    }
  } catch {
    // localStorage unavailable — fall through to OS/default resolution.
  }

  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return THEME.DARK;
    }
  } catch {
    // matchMedia unavailable/unsupported — fall through to default.
  }

  return THEME.DARK;
}
