import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "system-ui", "sans-serif"],
      },
      colors: {
        bg:            "#faf9f6",
        surface:       "#ffffff",
        panel:         "#eef0e8",
        border:        "#a4ac86",
        primary:       "#2d4a2b",
        "primary-dark":"#1f3520",
        accent:        "#7d8471",
        muted:         "#7d8471",
        ink:           "#1e2c1d",
        danger:        "#b7472a",
        success:       "#4a7c59",
      },
    },
  },
  plugins: [],
};
export default config;
