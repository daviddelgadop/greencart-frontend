/** @type {import('tailwindcss').Config} */
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
      colors: {
        "gc-green-dark": "#2E7D32",
        "gc-green": "#2E7D32",
        "gc-green-light": "#4FBF8A",
        "gc-beige": "#F4EEDC",
        "gc-orange": "#E89A3D",
        "gc-orange-dark": "#cf852f",
        "gc-text-dark": "#0B3D2E",
        "gc-text-light": "#FFFFFF",
      },
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
