import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0D573E",
          50: "#EEF7F2",
          100: "#D5ECE0",
          200: "#A9D7C0",
          300: "#73BB97",
          400: "#3A8F68",
          500: "#0D573E",
          600: "#0A4A34",
          700: "#083D2B",
          800: "#063022",
          900: "#042318",
        },
        accent: {
          DEFAULT: "#F8C73E",
          50: "#FFFAEB",
          100: "#FEF1C8",
          200: "#FDE494",
          300: "#FBD666",
          400: "#F8C73E",
          500: "#EFB420",
          600: "#D0940D",
          700: "#A6720B",
          800: "#7F570E",
          900: "#5E400D",
        },
        ink: {
          DEFAULT: "#0F1B16",
          soft: "#1E2C26",
        },
        muted: {
          DEFAULT: "#5F6C66",
          foreground: "#86918C",
        },
        line: "#E5EBE7",
        soft: "#F5F8F6",
        cream: "#FFFBF0",
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
