/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090D14',
        surface: '#0F1523',
        'surface-elevated': '#161F33',
        'surface-border': '#1E293B',
        charcoal: '#0F172A',
        accent: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          muted: '#1D4ED8',
          subtle: 'rgba(59, 130, 246, 0.1)',
        },
        congestion: {
          low: '#10B981',
          moderate: '#F59E0B',
          high: '#F97316',
          severe: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.03em',
        tighter: '-0.02em',
      }
    },
  },
  plugins: [],
};
