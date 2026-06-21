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
        sans: ["var(--font-nunito)", "Nunito", "system-ui", "sans-serif"],
      },
      colors: {
        blue: {
          DEFAULT: "#2481cc",
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#2481cc",
          600: "#1a6ab5",
          700: "#1558a0",
        },
        red: {
          DEFAULT: "#e53935",
        },
        green: {
          DEFAULT: "#43a047",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      animation: {
        "fade-up": "fadeUp 0.35s ease both",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
