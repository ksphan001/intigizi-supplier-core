/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "intigizi-green": "#8CC344",
        "intigizi-green-dark": "#269636",
        "intigizi-green-light": "#C5E4B6",
        "intigizi-green-soft": "#F1F8E9",
      },
    },
  },
  plugins: [],
}
