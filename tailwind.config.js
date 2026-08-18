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
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        aikichun: {
          "primary": "#d92027",
          "primary-content": "#ffffff",
          "secondary": "#1a2f23",
          "secondary-content": "#ffffff",
          "accent": "#ff737d",
          "accent-content": "#ffffff",
          "neutral": "#2a3d30",
          "neutral-content": "#ffffff",
          "base-100": "#1a2f23",
          "base-200": "#142319",
          "base-300": "#0f1a12",
          "base-content": "#ffffff",
          "info": "#3b82f6",
          "success": "#22c55e",
          "warning": "#eab308",
          "error": "#ef4444",
        },
      },
    ],
  },
}
