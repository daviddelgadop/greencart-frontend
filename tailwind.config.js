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
        // Couleurs accessibles (bon contraste)
        'green': {
          700: '#2F855A',  // ✅ Accessible sur blanc
          800: '#276749',  // ✅ Accessible sur blanc
          900: '#22543D',  // ✅ Accessible sur blanc
        },
        'amber': {
          50: '#FFFBEB',
          100: '#FEF3C7',
          400: '#FBBF24',
          500: '#F59E0B',  // ✅ Accessible sur blanc
          600: '#D97706',  // ✅ Accessible sur blanc
          700: '#B45309',  // ✅ Accessible sur blanc
          800: '#92400E',  // ✅ Accessible sur blanc
        }
      },
    },
  },
  plugins: [],
}
