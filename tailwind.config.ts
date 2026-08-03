import type { Config } from "tailwindcss";

/**
 * Differential Factor — Website design spec V2 (Aug 2026).
 * Print-quality research desk: Paper ground, Ink structure, Oxblood as a
 * signal only. No radii, no shadows, no gradients — those keys are emptied
 * below so a stray `rounded-lg` or `shadow-md` can't reintroduce them.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Square corners are a brand rule, not a default. Only `rounded-full` survives,
    // for the one genuinely circular element (the slider thumb is square — see globals).
    borderRadius: {
      none: "0",
      DEFAULT: "0",
      full: "9999px",
    },
    // No drop shadows anywhere in the compiled CSS (acceptance check §1).
    boxShadow: {
      none: "none",
    },
    extend: {
      colors: {
        background: "var(--df-paper)",
        foreground: "var(--df-ink)",
        df: {
          oxblood: "var(--df-oxblood)",
          ink: "var(--df-ink)",
          paper: "var(--df-paper)",
          panel: "var(--df-panel)",
          hairline: "var(--df-hairline)",
          lead: "var(--df-lead)",
          body: "var(--df-body)",
          meta: "var(--df-meta)",
        },
      },
      fontFamily: {
        display: ["var(--font-archivo)", "system-ui", "sans-serif"],
        body: ["var(--font-spectral)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        "df-canvas": "1440px",
        "df-lead": "840px",
        "df-body": "700px",
      },
      spacing: {
        "df-inset": "80px",
      },
      transitionDuration: {
        df: "160ms",
      },
      transitionTimingFunction: {
        df: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
