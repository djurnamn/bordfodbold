import { defineConfig } from "../config";
import { defaultTheme } from "./default";

/**
 * The Bordfodbold theme: djui's default with the app's own choices layered
 * on. Regenerate the tokens after editing: `pnpm theme:generate`.
 */
export const bordfodboldTheme = defineConfig(defaultTheme, {});
