/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 60-30-10 rule from PRD:
        // 60% Dominant: primaryBg
        // 30% Secondary: secondaryNavy
        // 10% Accent: accentGold / accentRed / accentGreen
        primaryBg: '#f8fafc',
        secondaryNavy: {
          light: '#1e40af',
          DEFAULT: '#0f172a',
          dark: '#020617',
        },
        accentGold: {
          light: '#f59e0b',
          DEFAULT: '#d97706',
          dark: '#b45309',
        },
        accentRed: {
          light: '#ef4444',
          DEFAULT: '#dc2626',
          dark: '#b91c1c',
        },
        accentGreen: {
          light: '#22c55e',
          DEFAULT: '#16a34a',
          dark: '#15803d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
