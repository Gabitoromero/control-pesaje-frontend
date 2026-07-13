import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#06b6d4',   // cyan-500 — acento principal
          hover: '#22d3ee',     // cyan-400 — hover sobre oscuro
          muted: 'rgb(6 182 212 / 0.1)',
          light: '#0891b2',     // cyan-600 — acento sobre fondo claro
          'light-bg': '#ecfeff', // cyan-50 — fondos destacados en modo claro
        },
        surface: {
          'dark-primary': '#09090b',    // zinc-950
          'dark-secondary': '#18181b',  // zinc-900
          'dark-tertiary': '#27272a',   // zinc-800
          'light-primary': '#fafafa',   // zinc-50
          'light-secondary': '#ffffff', // white
          'light-tertiary': '#f4f4f5',  // zinc-100
        },
        success: {
          DEFAULT: '#10b981',
          muted: 'rgb(16 185 129 / 0.1)',
        },
        danger: {
          DEFAULT: '#ef4444',
          muted: 'rgb(239 68 68 / 0.1)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          muted: 'rgb(245 158 11 / 0.1)',
        },
        // Raw text-on-surface colors from the OpenPencil design variables,
        // for the rare non-theme-aware surface (e.g. Monitoreo's standalone
        // full-dark chrome) that references a hardcoded ink tone directly
        // instead of the semantic (theme-switching) shadcn tokens above.
        // Named `ink` (not `text`) to avoid colliding with Tailwind's
        // `text-` utility prefix.
        ink: {
          'dark-primary': '#f4f4f5',    // zinc-100
          'dark-secondary': '#a1a1aa',  // zinc-400
          'dark-muted': '#71717a',      // zinc-500
          'light-primary': '#18181b',   // zinc-900
          'light-secondary': '#71717a', // zinc-500
        },
        // shadcn/ui tokens — CSS-variable driven so a future palette swap
        // only requires editing the vars in src/index.css, no component edits.
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'progress-fill': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        }
      },
      animation: {
        'progress-fill': 'progress-fill linear forwards',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
