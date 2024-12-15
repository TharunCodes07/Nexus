/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
        montserrat: ['var(--font-montserrat)'],
        outfit: ['var(--font-outfit)'],
        quicksand: ['var(--font-quicksand)'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 