import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#eef2f8',
          100: '#d5e0ef',
          200: '#adc1df',
          300: '#7da2cf',
          400: '#4d83bf',
          500: '#2d65af',
          600: '#1e4d8f',
          700: '#163a70',
          800: '#0f2d5c',   // couleur principale de la marque
          900: '#0a1f40',
          950: '#06132a',
        },
        accent: {
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
} satisfies Config
