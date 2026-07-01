/** @type {import('tailwindcss').Config} */
export default {
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
      },
    },
  },
  plugins: [],
}
