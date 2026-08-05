import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FD4646",
          50: "#FFF1F1",
          100: "#FFE0E0",
          200: "#FFC5C5",
          300: "#FF9C9C",
          400: "#FD6C6C",
          500: "#FD4646",
          600: "#E52F2F",
          700: "#BF2222",
          800: "#9C1F1F",
          900: "#7F1F1F",
        },
        ink: {
          DEFAULT: "#0B0B0F",
          soft: "#1C1C22",
        },
        muted: {
          DEFAULT: "#6B7280",
          foreground: "#8A8F9A",
        },
        line: "#ECECF1",
        soft: "#F7F7F9",
      },
      borderRadius: {
        md: "12px",
        lg: "14px",
        xl: "16px",
        "2xl": "18px",
        "3xl": "24px",
      },
      fontSize: {
        "display-lg": ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        display: ["2.75rem", { lineHeight: "1.08", letterSpacing: "-0.025em" }],
        "display-sm": ["2rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
      },
      maxWidth: {
        shell: "1280px",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
