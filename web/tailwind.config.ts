import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "system-ui", "sans-serif"],
      },
      colors: {
        bg:            "#FFFBEA",
        surface:       "#FFFFFF",
        panel:         "#FFF3B0",
        border:        "#111111",
        primary:       "#FFCE00",
        "primary-dark":"#E6B800",
        accent:        "#FF3B30",
        muted:         "#555555",
        ink:           "#111111",
        danger:        "#FF3B30",
        success:       "#1A7A3F",
      },
    },
  },
  plugins: [],
};
export default config;
