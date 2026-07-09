/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f7ff', 100: '#e0eefe', 200: '#bbdcfd', 300: '#7fbefb',
          400: '#3b9cf7', 500: '#3b82c4', 600: '#2e6aa3', 700: '#234f7c',
          800: '#1a3a5c', 900: '#0f2540',
        },
        clinical: {
          mint: '#e6f7f1', coral: '#ffe5e0', lavender: '#f0e9ff',
        }
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(15, 37, 64, 0.08)',
        card: '0 2px 8px -1px rgba(15, 37, 64, 0.06)',
      }
    },
  },
  plugins: [],
}