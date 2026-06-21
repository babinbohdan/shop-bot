import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "system-ui", "sans-serif"],
      },
      colors: {
        bg:            "#1c1428",
        surface:       "#2b1e3e",
        panel:         "#3a2a52",
        border:        "#6b5b9b",
        primary:       "#a490c2",
        "primary-dark":"#8878aa",
        accent:        "#4a4e8f",
        muted:         "#8b7aaa",
        ink:           "#e6e6fa",
        danger:        "#ff6b9d",
        success:       "#7bc67e",
      },
    },
  },
  plugins: [],
};
export default config;
