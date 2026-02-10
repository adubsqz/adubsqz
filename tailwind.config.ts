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
        'photo-bg': '#0C0C0C',
        'photo-fg': '#E8E6E3',
        'photo-muted': '#8A8784',
        'photo-border': '#2A2A2A',
      },
    },
  },
} satisfies Config;
