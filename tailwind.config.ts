import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Newsreader', 'Instrument Serif', 'Georgia', 'serif'],
        mono: [
          'IBM Plex Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
      colors: {
        'photo-bg': '#141210',
        'photo-panel': '#1c1a16',
        'photo-fg': '#ebe6dc',
        'photo-muted': '#a8a29a',
        'photo-border': '#3f3b34',
        'photo-accent': '#ebe6dc',
        'photo-accent-soft': '#78716a',
        mcm: {
          ink: '#141210',
          paper: '#ebe6dc',
          cream: '#f5f0e6',
          rust: '#c45c26',
          sage: '#7d9078',
          line: '#4a4338',
        },
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-reveal': {
          '0%': { opacity: '0', transform: 'translateY(0.6rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'specimen-flash': {
          '0%': { opacity: '0.2' },
          '40%': { opacity: '0.06' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 420ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-reveal': 'slide-reveal 520ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'specimen-flash': 'specimen-flash 720ms ease-out both',
      },
    },
  },
} satisfies Config;
