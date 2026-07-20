import tailwindcssAnimate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#312E81',
          dark: '#1a146b',
          light: '#4b41e1',
        },
        secondary: '#645efb',
        surface: {
          DEFAULT: '#fcf8ff',
          low: '#f6f2fa',
          container: '#f0ecf4',
          high: '#eae7ef',
          highest: '#e5e1e9',
        },
        border: '#E5E7EB',
        'on-surface': '#1b1b21',
        'on-surface-variant': '#474651',
        outline: '#777682',
        'outline-variant': '#c8c5d3',
        tertiary: {
          DEFAULT: '#5f2b00',
          light: '#de915e',
        },
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      maxWidth: {
        container: '1280px',
      },
      keyframes: {
        scroll: {
          to: { transform: 'translate(calc(-50% - 0.5rem))' },
        },
      },
      animation: {
        scroll: 'scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate, typography],
}
