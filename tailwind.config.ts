import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Instrument Serif', 'Georgia', 'serif'],
      },
      colors: {
        'photo-bg': '#050816',
        'photo-panel': '#050712',
        'photo-fg': '#E8E6E3',
        'photo-muted': '#8A8784',
        'photo-border': '#2A2A2A',
        'photo-accent': '#FBBF24',
        'photo-accent-soft': '#4C1D95',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 400ms ease-out',
      },
    },
  },
} satisfies Config;
