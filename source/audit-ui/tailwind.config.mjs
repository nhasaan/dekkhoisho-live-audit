/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6e0',
          300: '#5fe9ce',
          400: '#2dd4b8',
          500: '#4ecca3',
          600: '#45b393',
          700: '#3d9d84',
          800: '#358775',
          900: '#2d7266',
        },
        dark: {
          50: '#f8f8f9',
          100: '#e8e8eb',
          200: '#d1d1d6',
          300: '#b5b5bd',
          400: '#9696a1',
          500: '#787886',
          600: '#5d5d6b',
          700: '#464652',
          800: '#16213e',
          900: '#1a1a2e',
        },
        danger: {
          DEFAULT: '#e74c3c',
          light: '#f39c12',
          dark: '#c0392b',
        },
      },
    },
  },
  plugins: [],
}

