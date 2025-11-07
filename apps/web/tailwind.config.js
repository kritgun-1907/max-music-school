/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#6366F1',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#2e1065',
        },
        sandstone: {
          50: '#FAFAF9',
          100: '#F5F5F0',
          200: '#E8E6E1',
          300: '#D6D3CC',
          400: '#C4C0B8',
          500: '#B2ADA3',
        },
        ocean: {
          50: '#F0F9FA',
          100: '#EBF4F5',
          200: '#D6E4E5',
          300: '#C1D4D6',
          400: '#ADC4C7',
          500: '#98B4B8',
        },
        warm: {
          50: '#FDFCFB',
          100: '#FAF9F6',
          200: '#F0EDE8',
          300: '#E6E1D9',
          400: '#DCD5CB',
          500: '#D2C9BC',
        },
      },
      backgroundImage: {
        'gradient-sandstone': 'linear-gradient(135deg, #F5F5F0 0%, #E8E6E1 100%)',
        'gradient-ocean': 'linear-gradient(180deg, #EBF4F5 0%, #D6E4E5 100%)',
        'gradient-warm': 'linear-gradient(90deg, #FAF9F6 0%, #F0EDE8 100%)',
        'gradient-sky': 'radial-gradient(circle, #F0F4F8 0%, #E1E8ED 100%)',
        'gradient-lavender': 'linear-gradient(45deg, #F4F3F8 0%, #E9E7F0 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 15px rgba(0, 0, 0, 0.08)',
        medium: '0 4px 20px rgba(0, 0, 0, 0.12)',
        strong: '0 8px 30px rgba(0, 0, 0, 0.16)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};