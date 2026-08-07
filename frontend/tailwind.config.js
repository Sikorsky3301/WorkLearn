import tailwindcssAnimate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // A custom selector (not Tailwind's default `.dark` on <html>) applied only
  // to the Admin/SuperAdmin PortalShell root (see
  // src/components/design-system/theme/ThemeProvider.jsx) — so `dark:` utilities
  // used by shared portal components can never activate anywhere in the
  // student-facing app, even if a component is reused there later.
  darkMode: ['selector', '.wl-portal-dark'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Marketing headings only — see index.html for why.
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
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
