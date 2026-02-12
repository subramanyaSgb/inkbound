import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          bg: '#09090B',
          surface: '#18181B',
          card: '#1C1C22',
          border: '#27272A',
          highlight: 'rgba(212, 175, 55, 0.08)',
          glass: 'rgba(24, 24, 27, 0.6)',
        },
        accent: {
          primary: '#D4AF37',
          secondary: '#B8860B',
        },
        text: {
          primary: '#FAFAFA',
          secondary: '#A1A1AA',
          muted: '#71717A',
        },
        glow: {
          primary: 'rgba(212, 175, 55, 0.15)',
        },
        mood: {
          positive: '#7AAE7A',
          negative: '#AE7A7A',
          neutral: '#7A8BAE',
        },
        status: {
          error: '#D4544A',
          success: '#5B8C5A',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-crimson)', 'serif'],
        ui: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(212, 175, 55, 0.1)',
        'glow-md': '0 0 20px rgba(212, 175, 55, 0.15)',
        'glow-lg': '0 0 30px rgba(212, 175, 55, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
