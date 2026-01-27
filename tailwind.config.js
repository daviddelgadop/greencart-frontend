// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ✅ Couleurs exactes de votre maquette
        'pale-yellow': '#FFF0B1',
        'orange-beige': '#D79B65',
        'dark-green': '#508433',
        'medium-brown': '#866545',
        'dark-brown': '#422A19',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
      },
    },
  },
  plugins: [],
}
