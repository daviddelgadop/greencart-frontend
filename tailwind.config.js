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
        // Votre palette personnalisée
        'pale-yellow': '#fff0b1',
        'orange-beige': '#d79b65',
        'dark-green': '#508433',
        'medium-brown': '#866545',
        'dark-brown': '#422a19',
        
        // Palette verte étendue pour accessibilité
        'green': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',  // ✅ Bon contraste
          800: '#166534',  // ✅ Très bon contraste
          900: '#14532d',
        },
        
        // Palette orange pour les CTA
        'orange': {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        }
      },
      // ✅ Pour l'accessibilité : contrastes garantis
      backgroundColor: {
        'accessible-green': '#15803d',
        'accessible-orange': '#ea580c',
      },
      textColor: {
        'accessible-dark': '#1a202c',
        'accessible-light': '#f7fafc',
      }
    },
  },
  plugins: [],
}
