import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        primary: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
          dark: '#1D4ED8',
          light: '#60A5FA',
        },
        cyan: {
          DEFAULT: '#06B6D4',
          glow: 'rgba(6, 182, 212, 0.15)',
        },
        border: 'var(--border)',
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#10B981',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#F59E0B',
          foreground: '#000000',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(59, 130, 246, 0.25)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.25)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.25)',
        'glow-crimson': '0 0 25px -5px rgba(239, 68, 68, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
