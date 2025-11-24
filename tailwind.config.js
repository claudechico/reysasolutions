/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        // Custom brand colors
        // Dark blue: #262262 (CMYK: C:61%, M:65%, Y:0%, K:62%)
        'dark-blue': {
          DEFAULT: '#262262',
          50: '#e8e7f0',
          100: '#d1cfe1',
          200: '#a39fc3',
          300: '#756fa5',
          400: '#473f87',
          500: '#262262',
          600: '#1e1b4e',
          700: '#16143a',
          800: '#0e0d26',
          900: '#060612',
        },
        // Light blue: #1C75BC (CMYK: C:85%, M:38%, Y:0%, K:26%)
        'light-blue': {
          DEFAULT: '#1C75BC',
          50: '#e6f2fa',
          100: '#cce5f5',
          200: '#99cbeb',
          300: '#66b1e1',
          400: '#3397d7',
          500: '#1C75BC',
          600: '#165d96',
          700: '#114570',
          800: '#0b2e4a',
          900: '#061724',
        },
        // Aliases for consistency with existing code
        'dark-light-blue': {
          DEFAULT: '#1C75BC',
          50: '#e6f2fa',
          100: '#cce5f5',
          200: '#99cbeb',
          300: '#66b1e1',
          400: '#3397d7',
          500: '#1C75BC',
          600: '#165d96',
          700: '#114570',
          800: '#0b2e4a',
          900: '#061724',
        },
        'dark-dark-blue': {
          DEFAULT: '#262262',
          50: '#e8e7f0',
          100: '#d1cfe1',
          200: '#a39fc3',
          300: '#756fa5',
          400: '#473f87',
          500: '#262262',
          600: '#1e1b4e',
          700: '#16143a',
          800: '#0e0d26',
          900: '#060612',
        },
      },
    },
  },
  plugins: [],
};
