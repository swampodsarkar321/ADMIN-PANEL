/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0b1220',
        panel: 'rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [],
};
