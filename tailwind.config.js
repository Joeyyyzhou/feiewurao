/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Source Han Serif CN VF Light"', '"Source Han Serif CN"', '"Songti SC"', 'serif'],
        'serif-bold': ['"Source Han Serif CN VF Medium"', '"Source Han Serif CN"', '"Songti SC"', 'serif'],
        en: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      colors: {
        ink: {
          deep: 'rgba(255,255,255,0.97)',
          soft: 'rgba(255,255,255,0.6)',
          dim: 'rgba(255,255,255,0.4)',
        },
      },
    },
  },
  plugins: [],
};
