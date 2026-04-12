const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/{app,pages,components}/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "roboto-slab": ["'Rockwell'", "'Roboto Slab'", "Georgia", "serif"],
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "0" },
          "50%": { opacity: "1" },
        },
        drop: {
          from: { transform: "translateY(var(--drop-from))" },
          to: { transform: "translateY(0)" },
        },
      },
      animation: {
        blink: "blink 1s steps(1, start) infinite",
        drop: "drop 0.3s ease-out",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".drag-none": {
          "-moz-user-drag": "none",
          "-webkit-user-drag": "none",
          "-ms-user-drag": "none",
          "user-drag": "none",
        },
      });
    }),
  ],
};
