import type { Config } from "tailwindcss";
// import twTypography from "@tailwindcss/typography";
import twAnimate from "tailwindcss-animate";
import { generateClampSize } from "./src/lib/generate-clamp-size";
import { transform } from "next/dist/build/swc";

// https://github.com/tailwindlabs/tailwindcss/blob/master/stubs/config.full.js
// screens
// sm: '640px',
// md: '768px',
// lg: '1024px',
// xl: '1280px',
// '2xl': '1536px',

const bodyLineHeight = 24 / 17;

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/codeSamples/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "var(--space-inset)",
      screens: {
        lg: "1024px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-manrope)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        // GRAY
        // backgrounds (avoids namespace clash with Tailwind bg-*)
        canvas: "var(--color-gray-base)",
        "background-subtle": "var(--color-gray-bg-subtle)",
        background: "var(--color-gray-bg)",
        "background-hover": "var(--color-gray-bg-hover)",
        "background-active": "var(--color-gray-bg-active)",
        // borders, lines & focus rings
        line: "var(--color-gray-line)",
        border: "var(--color-gray-border)",
        "border-hover": "var(--color-gray-border-hover)",
        // solids
        "solid-lite": "var(--color-gray-solid-light)",
        solid: "var(--color-gray-solid)",
        "solid-hover": "var(--color-gray-solid-hover)",
        // text fills
        fill: "var(--color-gray-fill)",
        "fill-contrast": "var(--color-gray-fill-contrast)",
        "fill-bg": "var(--color-gray-fill-bg)",

        // ACCENTS
        "accent-background-subtle": "var(--color-accent-bg-subtle)",
        "accent-background": "var(--color-accent-bg)",
        "accent-background-active": "var(--color-accent-bg-active)",
        "accent-border": "var(--color-accent-border)",
        accent: "var(--color-accent-solid)",
        "accent-hover": "var(--color-accent-solid-hover)",
        "accent-fill": "var(--color-accent-fill)",
        "accent-fill-contrast": "var(--color-accent-fill-contrast)",

        // COVALUES
        "cov-background-subtle": "var(--color-cov-bg-subtle)",
        "cov-background": "var(--color-cov-bg)",
        "cov-background-active": "var(--color-cov-bg-active)",
        "cov-border": "var(--color-cov-border)",
        "cov-solid": "var(--color-cov-solid)",
        "cov-solid-hover": "var(--color-cov-solid-hover)",
        "cov-fill": "var(--color-cov-fill)",
        "cov-fill-contrast": "var(--color-cov-fill-contrast)",

        // MESH
        "mesh-fill": "var(--color-mesh-fill)",

        // "yellow-bg": "#fff1d6",
        // "yellow-bg": "#faf6ed",
        // "yellow-bg": "#fbf8f1",
        "yellow-bg": "#fdfaf3",

        // NOTICES
        "notice-background": "var(--color-notice-bg)",
        notice: "var(--color-notice-solid)",

        // GUIDES
        guide: "var(--guideSolidColor)",
        "guide-dark": "var(--guideDarkColor)",

        // ALPHAS: text-black-a4
        black: generateScale("black"),
        white: generateScale("white"),
      },
      fontSize: {
        fine: [
          generateClampSize(500, 1200, 9, 11),
          { lineHeight: `${bodyLineHeight}` },
        ],
        meta: [
          generateClampSize(500, 1200, 11, 13),
          { lineHeight: `${bodyLineHeight}` },
        ],
        small: [
          generateClampSize(500, 1200, 12, 14),
          { lineHeight: `${bodyLineHeight}` },
        ],
        base: [
          generateClampSize(500, 1200, 14, 16),
          { lineHeight: `${bodyLineHeight}` },
        ],
        large: [
          generateClampSize(500, 1200, 15, 17),
          { lineHeight: `${bodyLineHeight}` },
        ],
        xlarge: [
          generateClampSize(500, 1200, 17, 19),
          { lineHeight: `${bodyLineHeight}` },
        ],
        subheading: [
          generateClampSize(500, 1200, 18, 21),
          { lineHeight: "1.333" },
        ],
        heading: [generateClampSize(500, 1200, 20, 27), { lineHeight: "1.25" }],
        subtitle: [generateClampSize(500, 1200, 22, 33), { lineHeight: "1.2" }],
        title: [generateClampSize(500, 1200, 27, 42), { lineHeight: "1.2" }],
        subsuper: [
          generateClampSize(500, 1200, 32, 48),
          { lineHeight: "0.98" },
        ],
        super: [generateClampSize(500, 1200, 39, 60), { lineHeight: "0.98" }],
        code: ["0.85em", { lineHeight: "1.6" }],
      },
      letterSpacing: {
        tight: "0.02em",
        heading: "-0.02em",
        title: "-0.03em",
      },
      spacing: {
        nav: "var(--height-nav)",
        tab: "var(--height-tab)",
        button: "var(--height-button)",
        "button-sm": "var(--height-button-sm)",
        inset: "var(--space-inset)",
        "inset-2x": "var(--space-inset-2x)",
        "under-nav": "var(--space-under-nav)",
        "under-nav-nudge": "var(--space-under-nav-nudge)",
        "under-nav-content": "var(--space-under-nav-content)",
        "under-content": "calc(5*var(--space-inset))",
        em: "1em",

        // these can be used in w-* and max-w-*
        "text-px": "var(--container-text-px)",
        text: "var(--container-text)",
        "hero-px": "var(--container-hero-px)",
        hero: "var(--container-hero)",
        docs: "1040px",

        // lower value is 2/3 of upper value
        w3: generateClampSize(500, 1200, 8, 12),
        w4: generateClampSize(500, 1200, 10.5, 16),
        w6: generateClampSize(500, 1200, 16, 24),
        w8: generateClampSize(500, 1200, 21, 32),
        w10: generateClampSize(500, 1200, 27, 40),
        w12: generateClampSize(500, 1200, 32, 48),
        w16: generateClampSize(500, 1200, 43, 64),
        w20: generateClampSize(500, 1200, 54, 80),
        w24: generateClampSize(500, 1200, 64, 96),
        w28: generateClampSize(500, 1200, 75, 112),
        w32: generateClampSize(500, 1200, 85, 128),
        w36: generateClampSize(500, 1200, 96, 144),
        w42: generateClampSize(500, 1200, 112, 168),
        w48: generateClampSize(500, 1200, 128, 192),
        w64: generateClampSize(500, 1200, 171, 256),
        w72: generateClampSize(500, 1200, 192, 288),
        w96: generateClampSize(500, 1200, 256, 384),
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        spin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        spin: "spin 40s linear infinite",
      },
    },
  },
  // twTypography()
  plugins: [twAnimate],
};

export default config;

// https://fynn.at/shorts/2023-03-19-how-to-use-radix-colors-with-tailwind-css
function generateScale(name: string) {
  let scale = Array.from({ length: 12 }, (_, i) => {
    let id = i + 1;
    return [
      [id, `var(--${name}-${id})`],
      [`a${id}`, `var(--${name}-a${id})`],
    ];
  }).flat();

  return Object.fromEntries(scale);
}