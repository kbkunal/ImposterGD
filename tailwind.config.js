/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          bg: "#080B14",
          surface: "#10162A",
          card: "#161D36",
          border: "#252F52",
          hover: "#1E2748",
          purple: "#8B5CF6",
          cyan: "#38BDF8",
          coral: "#F43F5E",
          amber: "#F59E0B",
          emerald: "#10B981",
        }
      },
      fontFamily: {
        game: ['"Outfit"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glowPulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 4s ease-in-out infinite',
        'table-spin-subtle': 'spin 180s linear infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: 0.8, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.03)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
