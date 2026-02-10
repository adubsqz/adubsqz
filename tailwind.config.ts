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
        'photo-bg': '#02040A',
        'photo-panel': '#050608',
        'photo-fg': '#F5F5F5',
        'photo-muted': '#9CA3AF',
        'photo-border': '#27272A',
        'photo-accent': '#F9FAFB',
        'photo-accent-soft': '#4B5563',
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
