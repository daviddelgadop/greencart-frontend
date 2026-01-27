c est bon /** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },

      // 🎨 PALETTE ACCESSIBLE GREEN CART
      colors: {
        // Couleurs principales accessibles
        "gc-green-dark": "#0B3D2E",   // Fond HERO, CTA final
        "gc-green": "#1E7A50",        // Accents
        "gc-green-light": "#4FBF8A",  // Hover léger

        "gc-beige": "#F4EEDC",        // Fond clair
        "gc-orange": "#E89A3D",       // CTA principal
        "gc-orange-dark": "#cf852f",  // Hover CTA

        // Texte
        "gc-text-dark": "#0B3D2E",
        "gc-text-light": "#FFFFFF",
      },

      // ✨ Animations
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}
