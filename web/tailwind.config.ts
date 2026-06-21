import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        bg:           "#0F0F1A",
        surface:      "#1C1C2E",
        panel:        "#2D2D44",
        border:       "#3A3A5C",
        gold:         "#C9A84C",
        "gold-light": "#E8C96B",
        muted:        "#9B9A8A",
        ink:          "#F0EDD8",
        primary:      "#C9A84C",
        danger:       "#E05555",
        success:      "#4CAF7D",
      },
    },
  },
  plugins: [],
};

export default config;
