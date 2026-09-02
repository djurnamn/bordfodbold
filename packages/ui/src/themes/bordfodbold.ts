import { defineConfig } from "../config";
import { defaultTheme } from "./default";

/**
 * The Bordfodbold theme: djui's default with the app's own choices layered
 * on. Regenerate the tokens after editing: `pnpm theme:generate`.
 *
 * Inter is loaded by the app through `next/font` and exposed as
 * `--font-inter`; the theme only states the stack.
 */
export const bordfodboldTheme = defineConfig(defaultTheme, {
  font: { default: 'var(--font-inter), Inter, system-ui, -apple-system, sans-serif' },
  typography: {
    numeric: { fontVariantNumeric: "tabular-nums", fontWeight: 600 },
  },
});
