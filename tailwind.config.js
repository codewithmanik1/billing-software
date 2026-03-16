/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0f0f0f',
          800: '#1a1a1a',
          700: '#2a2a2a',
          600: '#3a3a3a',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#F5DFA0',
          dark: '#A68A3D',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        }
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
      }
    },
  },
  plugins: [],
};
