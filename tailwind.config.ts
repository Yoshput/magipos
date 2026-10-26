import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nyeni: {
          navy: "#142A72",
          "navy-hover": "#0F2056",
          blue: "#1769E8",
          "blue-hover": "#1254BA",
          "blue-soft": "#EAF2FF",
          mango: "#FFC928",
          "mango-hover": "#E6B31F",
          "mango-soft": "#FFF5D1",
        },
        surface: "#FFFFFF",
        background: "#F5F7FB",
        foreground: "#172033",
        muted: "#667085",
        "muted-light": "#98A2B3",
        border: "#E5E9F2",
        success: {
          DEFAULT: "#16845B",
          soft: "#E8F8F0",
        },
        warning: {
          DEFAULT: "#B86A00",
          soft: "#FFF3E0",
        },
        danger: {
          DEFAULT: "#C93636",
          soft: "#FDECEC",
        },
        info: {
          DEFAULT: "#1769E8",
          soft: "#EAF2FF",
        },
      },
      borderRadius: {
        ios: "12px",
        "ios-card": "18px",
        "ios-sheet": "24px",
      },
      boxShadow: {
        ios: "0 4px 20px -2px rgba(20, 42, 114, 0.06), 0 2px 6px -1px rgba(20, 42, 114, 0.04)",
        "ios-float": "0 10px 30px -4px rgba(20, 42, 114, 0.12), 0 4px 10px -2px rgba(20, 42, 114, 0.06)",
        "ios-modal": "0 20px 40px -8px rgba(20, 42, 114, 0.2)",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
