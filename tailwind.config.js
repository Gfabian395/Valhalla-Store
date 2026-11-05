/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        valhalla: {
          red: '#dc2626',
          yellow: '#facc15',
          dark: '#1e293b',
        }
      }
    },
  },
  plugins: [],
}