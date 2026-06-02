import type { Config } from "tailwindcss";

// Tailwind utilities map to the design tokens defined in app/globals.css.
// Per the seed style guide: no raw hex or px in components. Reference tokens by name.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    // Replace (not extend) the default palette so only semantic tokens are reachable.
    colors: {
      transparent: "transparent",
      current: "currentColor",
      gray: {
        0: "var(--gray-0)",
        1: "var(--gray-1)",
        2: "var(--gray-2)",
        3: "var(--gray-3)",
        4: "var(--gray-4)",
        5: "var(--gray-5)",
        6: "var(--gray-6)",
        7: "var(--gray-7)",
        8: "var(--gray-8)",
        9: "var(--gray-9)",
        10: "var(--gray-10)",
        11: "var(--gray-11)",
        12: "var(--gray-12)",
      },
      accent: "var(--accent)",
      "accent-weak": "var(--accent-weak)",
      caution: "var(--status-caution)",
      success: "var(--status-success)",
    },
    fontSize: {
      meta: ["var(--font-size-meta)", { lineHeight: "1.4" }],
      body: ["var(--font-size-body)", { lineHeight: "1.6" }],
      lead: ["var(--font-size-lead)", { lineHeight: "1.5" }],
      title: ["var(--font-size-title)", { lineHeight: "1.3" }],
      display: ["var(--font-size-display)", { lineHeight: "1.15" }],
    },
    spacing: {
      0: "0",
      1: "var(--space-1)",
      2: "var(--space-2)",
      3: "var(--space-3)",
      4: "var(--space-4)",
      5: "var(--space-5)",
      6: "var(--space-6)",
      8: "var(--space-8)",
      10: "var(--space-10)",
      12: "var(--space-12)",
      16: "var(--space-16)",
    },
    borderRadius: {
      none: "0",
      sm: "var(--radius-sm)",
    },
    extend: {
      fontFamily: {
        sans: "var(--font-sans)",
        serif: "var(--font-serif)",
        mono: "var(--font-mono)",
      },
      maxWidth: {
        prose: "var(--measure)",
      },
      transitionDuration: {
        confirm: "var(--motion-confirm)",
        layout: "var(--motion-layout)",
      },
    },
  },
  plugins: [],
};

export default config;
