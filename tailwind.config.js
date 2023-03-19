const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/{app,pages,components}/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "source-sans-pro": ["Source Sans Pro", "sans-serif"],
        quattrocento: ["Quattrocento", "serif"],
        "special-elite": ["Special Elite", "serif"],
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "0" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        blink: "blink 1s steps(1, start) infinite",
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
