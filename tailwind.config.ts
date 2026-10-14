import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          raised: "rgb(var(--ink-raised) / <alpha-value>)",
          sunk: "rgb(var(--ink-sunk) / <alpha-value>)",
        },
        paper: {
          DEFAULT: "rgb(var(--paper) / <alpha-value>)",
          dim: "rgb(var(--paper-dim) / <alpha-value>)",
        },
        line: "rgb(var(--line) / <alpha-value>)",
        signal: "rgb(var(--signal) / <alpha-value>)",
        mint: "rgb(var(--mint) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        mono: ["var(--font-mono)", ...fontFamily.mono],
        display: ["var(--font-display)", ...fontFamily.serif],
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
