import { defineConfig } from "../config";
import type { DjuiColorDefinition } from "../config/types";
import { defaultTheme } from "./default";

/**
 * The Bordfodbold theme: djui's default with the app's own choices layered
 * on. Regenerate the tokens after editing: `pnpm theme:generate`.
 *
 * Inter is loaded by the app through `next/font` and exposed as
 * `--font-inter`; the theme only states the stack.
 *
 * The palette is the same in both modes. The eight accents are the team
 * colors: mid-luminance hues that hold on the dark ground and on paper alike,
 * ordered so the first few are the most distinct from one another. The
 * context colors are their own family, kept apart from the accents so a won
 * cell never reads as a team.
 */

const inkDark = "#14100f";
const inkLight = "#ffffff";
const variations = { light: 3, dark: 3 };

const accent = (value: string, contrast: string): DjuiColorDefinition => ({ value, variations: variations, contrast });
const context = (value: string): DjuiColorDefinition => ({ value, variations: variations });

const accents = {
  primary: accent("#7b61ff", inkLight), // violet
  secondary: accent("#34b36e", inkDark), // green
  tertiary: accent("#e04c9f", inkLight), // magenta
  quaternary: accent("#f0be3c", inkDark), // yellow
  quinary: accent("#3a86ff", inkLight), // blue
  senary: accent("#f2703a", inkDark), // orange
  septenary: accent("#22b0b0", inkDark), // aqua
  octonary: accent("#f06060", inkDark), // coral
};

const contexts = {
  positive: context("#23a55a"),
  negative: context("#e5484d"),
  warning: context("#f0a020"),
  info: context("#2e7de9"),
  neutral: context("#8a8a94"),
};

export const bordfodboldTheme = defineConfig(defaultTheme, {
  font: { default: "var(--font-inter), Inter, system-ui, -apple-system, sans-serif" },
  // Washes a step stronger than the kit's 1/16: a hovered button has to read
  // as hovered on the dark ramp.
  alpha: { unit: 1 / 10 },
  colors: {
    dark: {
      // The ramp starts closer to the ground, so the first surface step - the
      // page to a table - is a shade, not a jump. The top of the ramp holds.
      surface: { from: "#110d0f", to: "#52404a" },
      accent: accents,
      context: contexts,
    },
    light: {
      accent: accents,
      context: contexts,
    },
  },
  typography: {
    numeric: { fontVariantNumeric: "tabular-nums", fontWeight: 600 },
  },
});
