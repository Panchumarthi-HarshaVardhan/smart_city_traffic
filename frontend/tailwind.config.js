/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg-primary)',
        'background-soft': 'var(--color-bg-soft)',
        surface: 'var(--color-bg-surface)',
        'surface-elevated': 'var(--color-bg-surface-elevated)',
        'surface-border': 'var(--color-border)',
        'surface-border-subtle': 'var(--color-border-subtle)',
        navy: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
        },
        accent: {
          DEFAULT: '#0284C7', // Sky-blue primary
          hover: '#0369A1',
          light: '#E0F2FE',
          subtle: 'rgba(2, 132, 199, 0.08)',
        },
        congestion: {
          low: '#10B981', // Clean Emerald
          moderate: '#F59E0B', // Warm Amber
          high: '#F97316', // Vibrant Orange
          severe: '#EF4444', // Crimson Red
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'soft-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'soft-xl': '0 20px 30px -4px rgba(2, 132, 199, 0.08), 0 8px 10px -4px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
};
