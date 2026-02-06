/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
      colors: {
        'pale-yellow': '#fff0b1',
        'orange-beige': '#d79b65',

        // 🌿 NOUVEAU VERT ACCESSIBLE
        'dark-green': '#3D6627',

        'medium-brown': '#866545',
        'dark-brown': '#422a19',

        // Optionnel : verts supplémentaires si tu veux
        'green': {
          700: '#2F4E1E',   // vert très foncé
          800: '#1F3A16',   // encore plus profond
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
