import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        beevo: {
          yellow: "var(--beevo-yellow)",
          "yellow-hover": "var(--beevo-yellow-hover)",
          honey: "var(--beevo-honey)",
          "honey-text": "var(--beevo-honey-text)",
          "honey-display": "var(--beevo-honey-display)",
          ink: "var(--beevo-ink)",
          dark: "var(--beevo-ink)",
          body: "var(--beevo-body)",
          muted: "var(--beevo-muted)",
          white: "var(--beevo-white)",
          canvas: "var(--beevo-canvas)",
          cream: "var(--beevo-cream)",
          "cream-deep": "var(--beevo-cream-deep)",
          border: "var(--beevo-border)",
          "border-warm": "var(--beevo-border-warm)",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        beevo: "var(--beevo-shadow)",
        "beevo-card": "var(--beevo-shadow-card)",
        "beevo-popular": "var(--beevo-shadow-popular)",
        "beevo-cta": "var(--beevo-shadow-cta)",
        "beevo-yellow-sm": "0 6px 16px rgba(255, 201, 40, 0.34)",
      },
      borderRadius: {
        card: "16px",
        panel: "20px",
        eyebrow: "9px",
      },
      maxWidth: {
        beevo: "1220px",
      },
    },
  },
  plugins: [],
};

export default config;
