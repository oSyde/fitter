import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080b0a",
        panel: "#101513",
        acid: "#c1f36a",
      },
      fontFamily: {
        sans: ["Arial", "Helvetica Neue", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
