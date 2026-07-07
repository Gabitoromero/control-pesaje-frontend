import { useTheme } from './ThemeContext';

/**
 * Dev-only theme toggle. Only ever mounted when the URL contains the exact
 * query param `?devTheme=1` — see the gate in App.tsx. Real operators never
 * see this control.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 z-[9999] rounded-full border border-border bg-background px-3 py-2 text-sm text-foreground shadow-lg"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
