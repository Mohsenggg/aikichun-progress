/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'aikido-green': '#1a2f23',
        'aikido-red': '#d92027',
      }
    },
  },
  plugins: [],
}
