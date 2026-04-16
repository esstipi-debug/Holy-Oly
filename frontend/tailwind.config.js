/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'holy-bg': '#07070F',
        'holy-surface': '#111118',
        'holy-primary': '#22C55E',
        'holy-gold': '#F59E0B',
        'holy-cyan': '#06B6D4',
        'holy-indigo': '#818cf8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
