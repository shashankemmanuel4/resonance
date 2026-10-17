import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "#0A0B0E",
        surface: "#12141A",
        subtle: "#1A1D26",
        "border-subtle": "#262A36",
        "border-strong": "#3B4254",
        "text-primary": "#F3F4F6",
        "text-secondary": "#9CA3AF",
        "text-tertiary": "#6B7280",
        "accent-indigo": "#6366F1",
        "accent-amber": "#F59E0B",
        "accent-teal": "#14B8A6",
        "accent-rose": "#F43F5E",
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Geist Mono", "monospace"],
      },
      transitionTimingFunction: {
        "smooth-out": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
