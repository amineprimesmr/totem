import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        totem: {
          accent: '#0a7c42',
          'accent-hover': '#088f4e',
          'accent-light': 'rgba(10, 124, 66, 0.12)',
          surface: '#1a1a1a',
          border: '#2a2a2a',
          muted: '#888',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        outfit: ['Outfit', 'system-ui', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        totem: '16px',
        'totem-sm': '10px',
        'totem-md': '14px',
        'totem-lg': '18px',
      },
      boxShadow: {
        'landing-bar':
          '0 2px 0 rgba(255, 255, 255, 0.9) inset, 0 -1px 0 rgba(0, 0, 0, 0.04) inset, 0 1px 2px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.1), 0 10px 24px rgba(0, 0, 0, 0.14)',
        'auth-card':
          '-1px -1px 3px rgba(255, 255, 255, 0.95), 1px 1px 2px rgba(0, 0, 0, 0.03), 4px 6px 16px rgba(0, 0, 0, 0.06), 10px 14px 40px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'auth-card-in': 'authCardIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
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
        authCardIn: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
