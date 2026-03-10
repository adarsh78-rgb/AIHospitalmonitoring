/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        medical: {
          50: "#eef8ff",
          100: "#d8eeff",
          200: "#b2dcff",
          300: "#7dc4ff",
          400: "#49a7ff",
          500: "#1e88e5",
          600: "#166eb9",
          700: "#145995",
          800: "#164c79",
          900: "#173f64"
        }
      }
    }
  },
  plugins: []
};
