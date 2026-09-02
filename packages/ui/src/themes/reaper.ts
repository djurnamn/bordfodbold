import type { DjuiConfig, DjuiColorDefinition } from "../config/types";
import { baseConfig } from "../config/base";
import { defaultTheme } from "./default";

/**
 * The REAPER theme — a single-mode dark theme keyed to the REAPER Default 7.0
 * palette.
 *
 * Surface is the REAPER dark gradient (`#202020 → #545454`, the VU-meter-to-
 * MIDI-list range); the accent is REAPER's iconic "armed" teal `#1ABC98`, which
 * lights up active toolbar buttons throughout the UI.
 *
 * Single-mode: surface, foreground, form, and the accent/context palette are
 * declared at root, so they apply regardless of `data-djui-mode`. A complete,
 * self-contained config — it declares its whole palette rather than extending
 * another theme.
 */

const VARIATIONS = { light: 3, dark: 3 };
const TEAL = "#1ABC98";
const TEAL_LABEL = "#121A1D";

const swatch = (value: string, contrast?: string): DjuiColorDefinition => ({
  value,
  variations: VARIATIONS,
  ...(contrast ? { contrast } : {}),
});

export const reaperTheme: DjuiConfig = {
  ...baseConfig,

  // REAPER's UI is drawn in Arial-family fonts (track titles and labels default
  // to Arial; dialogs fall back to the platform default). Arimo is the open,
  // metric-compatible match — self-hosted via the preferred file-asset path so
  // the theme carries its own face with no external dependency.
  font: {
    default: "Arimo",
    families: {
      Arimo: {
        fallbacks: ["Arial", "system-ui", "sans-serif"],
        variations: [
          { filename: "Arimo-Regular.woff2", weight: 400 },
          { filename: "Arimo-Bold.woff2", weight: 700 },
        ],
      },
    },
  },

  // No componentGroups override: the focus ring and the control accent (the
  // checked/active fill of checkbox/radio/switch/slider/progress) inherit the
  // base `accent-default`, which resolves to REAPER's primary accent — its
  // armed teal, the color that lights up active controls in REAPER itself.

  colors: {
    accent: {
      primary: swatch(TEAL, TEAL_LABEL),
      secondary: swatch(TEAL),
      tertiary: swatch("#9F9F9F", TEAL_LABEL),
    },

    // REAPER ships no distinct semantic colors for positive/negative/warning, so
    // these stay neutral-default; `info` is routed through the teal to keep info
    // surfaces on-brand.
    context: {
      positive: swatch("#22c55e"),
      negative: swatch("#ef4444"),
      warning: swatch("#f59e0b"),
      info: swatch(TEAL),
      neutral: swatch("#6b7280"),
    },

    surface: {
      from: "#202020", // deepest backdrop
      to: "#545454", // lightest panel surface
      levels: 8,
      lookahead: 4,
      easing: "ease-out",
      variations: { light: 3, dark: 3, amount: 3 },
    },
    foreground: {
      // REAPER's toolbar text — clear without being pure white.
      primary: { value: "#DCDCDC", variations: { light: 3, dark: 3, amount: 8 } },
      contrast: "#1A1A1A",
    },
    // Input background (and the focus ring) inherit base `componentGroups.form.colors`:
    // the root `inputBackground: surface-1` is right for this single-mode dark theme.
    // Dark-leaning — opt into font smoothing.
    antialiasing: true,
  },

  // djui's standard type scale; a theme may diverge here, but REAPER keeps it.
  typography: defaultTheme.typography,
};
