/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
