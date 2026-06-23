import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f6f2',
          100: '#e0ebe0',
          200: '#c2d7c2',
          300: '#9bbc9b',
          400: '#72a072',
          500: '#508550',
          600: '#1a4a1a',
          700: '#153b15',
          800: '#0f2e0f',
          900: '#0a200a',
        },
        cream: {
          50: '#fefcf7',
          100: '#fdf9f0',
          200: '#fbf3e3',
          300: '#f7e9cc',
          400: '#f2dcaa',
          500: '#ecd083',
        },
        amber: {
          400: '#f5a623',
          500: '#f5a623',
          600: '#e0921b',
        },
      },
      fontFamily: {
        heading: ['Fraunces', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 12px rgba(26, 74, 26, 0.06)',
        'soft-lg': '0 4px 24px rgba(26, 74, 26, 0.08)',
        'warm': '0 4px 20px rgba(245, 166, 35, 0.12)',
        'warm-lg': '0 8px 32px rgba(245, 166, 35, 0.15)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'bounce-subtle': 'bounce-subtle 2.5s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
