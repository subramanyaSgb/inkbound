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
          bg: '#0D0B0E',
          surface: '#1A1620',
          card: '#221E2A',
          border: '#2E2836',
          highlight: 'rgba(196, 149, 106, 0.12)',
        },
        accent: {
          primary: '#C4956A',
          secondary: '#8B6914',
        },
        text: {
          primary: '#E8DFD0',
          secondary: '#9B8E7E',
          muted: '#6B5F52',
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
    },
  },
  plugins: [],
};
export default config;
