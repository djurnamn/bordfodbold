import type { DjuiConfig, DjuiColorDefinition } from "../config/types";
import { baseConfig } from "../config/base";

/**
 * The default djui theme — a complete, self-contained config built over the
 * palette-agnostic base.
 *
 * It is **mode-divergent**: the two modes are deliberately different aesthetics,
 * so `accent` and `context` are declared per-mode rather than once at root.
 *
 * - **Dark** — 90s rave neons on a warm licorice ground. Loud, saturated accent
 *   neons over a near-black warm-mauve surface; the warm dark ground is what
 *   makes the neons read. Accents carry a dark ink label (the "glowing neon"
 *   look); the one accent dark enough to need a light label is the electric blue.
 * - **Light** — neo-brutalist: fuller, saturated poster accents over near-white
 *   paper, black-on-bright labels (only the two darkest accents take light ink).
 *
 * The accent set ships eight colors as a categorical scale, ordered so the lowest
 * ordinals are the most mutually distinct — a consumer charting a few series gets
 * maximum separation out of the box.
 *
 * Each semantic hue is defined once as a shared constant and reused across modes:
 * a saturated value is a light-mode accent and the matching dark-mode context;
 * a soft value is a dark-mode accent and the matching light-mode context.
 */

// Label inks. A near-black licorice for the dark neons; a warm off-white for the
// two dark accents that need a light label.
const DARK_INK = "#161012";
const DARK_LABEL_LIGHT = "#f7eef9";
const LIGHT_INK = "#141414";
const LIGHT_LABEL_LIGHT = "#ffffff";

// Saturated semantic family — a light-mode accent and the matching dark-mode
// context color.
const SATURATED_RED = "#ff3b30";
const SATURATED_GREEN = "#34c251";
const SATURATED_YELLOW = "#ffd400";
const SATURATED_BLUE = "#1212ff";

// Soft semantic family — a dark-mode accent and the matching light-mode context.
const SOFT_CORAL = "#ff6b81";
const SOFT_GREEN = "#93ff5e";
const SOFT_YELLOW = "#fff476";
const SOFT_BLUE = "#6161ff";

// Variation ramps. Accents and context expose three lighter and three darker
// steps (the `lighter`/`darker` steps feed the hatch pattern); surfaces and
// foreground carry the same depth used across the system.
const COLOR_VARIATIONS = { light: 3, dark: 3 };
const SURFACE_VARIATIONS = { light: 3, dark: 3, amount: 3 };
const FOREGROUND_VARIATIONS = { light: 3, dark: 3, amount: 8 };

const accent = (value: string, contrast: string): DjuiColorDefinition => ({
  value,
  variations: COLOR_VARIATIONS,
  contrast,
});
const context = (value: string): DjuiColorDefinition => ({
  value,
  variations: COLOR_VARIATIONS,
});

export const defaultTheme: DjuiConfig = {
  ...baseConfig,

  // Dongle — a soft, rounded display sans, self-hosted (the preferred path: the
  // woff2 files ship with the theme and the generator emits the `@font-face`
  // rules). The computed stack tails the system fonts as the loading fallback.
  //
  // Dongle's glyphs render small (x-height 0.28 em), so `size-adjust: 172%`
  // enlarges the face to sit at the fallback's visual size — calibrated, not
  // guessed: it lands Dongle's x-height (and cap-height) on `system-ui`'s, the
  // first fallback. Applied to the face only, so the fallback is untouched
  // (bumping `typography.*.fontSize` would enlarge it too, risking broken layout
  // when Dongle fails to load).
  //
  // But `size-adjust` scales *every* metric, including the intrinsic line box
  // (ascent 850 + descent 598 = 1.448 em), which would balloon `line-height:
  // normal` to ~2.17 em. The `*-override` descriptors redefine that line box for
  // Dongle only — final metric = override × size-adjust, so these × 172% give a
  // ~1.19 em `normal`, near `system-ui`'s, without a `line-height` hack (which
  // would crush the fallback too).
  //
  // The ascent/descent *split* is what vertically centers the text. Dongle's own
  // metrics are descent-heavy (it reserves 0.598 em of descent for 0.25 em-deep
  // descenders), so splitting on its natural ratio rides the glyphs high with a
  // dead band below. These overrides instead center the measured glyph extent —
  // equal space above the tallest ascender (0.748 em) and below the lowest
  // descender (0.249 em), so descenders stay unclipped.
  //
  // Dongle reads light, so the faces are mapped **one step up** in the
  // `@font-face` weight scope: Light answers `400` (normal), Regular answers
  // `600`, Bold stays `700`. The type scale then lands a step airier without
  // re-weighting every variant — normal body text renders on Dongle Light, the
  // `600` headings/labels on Dongle Regular, and the `700` title on Dongle Bold.
  font: {
    default: "Dongle",
    families: {
      Dongle: {
        fallbacks: ["system-ui", "-apple-system", "sans-serif"],
        sizeAdjust: "172%",
        ascentOverride: "49%",
        descentOverride: "20%",
        lineGapOverride: "0%",
        variations: [
          { filename: "Dongle-Light.woff2", weight: 400 },
          { filename: "Dongle-Regular.woff2", weight: 600 },
          { filename: "Dongle-Bold.woff2", weight: 700 },
        ],
      },
    },
  },

  colors: {
    dark: {
      surface: {
        // Licorice / warm mauve-black. The subtle pink chroma is kept (not
        // neutralized to gray) — it is what makes the neons pop.
        from: "#161012",
        to: "#52404a",
        levels: 8,
        lookahead: 4,
        easing: "ease-out",
        variations: SURFACE_VARIATIONS,
      },
      // No `backdrop`: the ground is the generated `surface-0`, one ramp step
      // below `from` (≈ the `#0d0a0b` this theme used to state by hand). A
      // theme that wants a ground apart from its ramp names one here.
      foreground: {
        // Warm off-white — a hair of pink over neutral.
        primary: { value: "#f3ebee", variations: FOREGROUND_VARIATIONS },
        contrast: DARK_INK,
      },
      // Pure-hue neons. Ordinals ordered most-distinct-first (violet / green /
      // magenta / yellow), warmer-and-closer hues at the high ordinals.
      accent: {
        primary: accent("#9371f3", DARK_INK), // violet
        secondary: accent(SOFT_GREEN, DARK_INK), // electric green
        tertiary: accent("#ff5cf0", DARK_INK), // neon magenta
        quaternary: accent(SOFT_YELLOW, DARK_INK), // neon yellow
        quinary: accent(SOFT_BLUE, DARK_LABEL_LIGHT), // electric blue — light label
        senary: accent("#ff9e4d", DARK_INK), // neon orange
        septenary: accent("#8affe2", DARK_INK), // aqua
        octonary: accent(SOFT_CORAL, DARK_INK), // coral
      },
      // Status colors reuse the saturated semantic family (their light-mode
      // accent twins).
      context: {
        negative: context(SATURATED_RED),
        warning: context(SATURATED_YELLOW),
        positive: context(SATURATED_GREEN),
        info: context(SATURATED_BLUE),
        neutral: context("#8a767a"), // licorice mauve-gray
      },
      antialiasing: true,
    },

    light: {
      surface: {
        // Near-white paper. Depth in light mode is inherently subtle; the
        // boldness comes from the accents, not the surface ramp.
        from: "#e4e4e6",
        to: "#ffffff",
        levels: 8,
        lookahead: 4,
        variations: SURFACE_VARIATIONS,
      },
      foreground: {
        primary: { value: LIGHT_INK, variations: FOREGROUND_VARIATIONS },
        contrast: "#ffffff",
      },
      // Four complementary pairs in sequence — blue↔orange, red↔green,
      // yellow↔purple, cyan↔pink — so adjacent duos contrast; the pair order
      // front-loads the five most important hues. Black-on-bright is the
      // brutalist signature; only the two darkest accents take a light label.
      accent: {
        primary: accent(SATURATED_BLUE, LIGHT_LABEL_LIGHT), // electric blue — light label
        secondary: accent("#ff7a00", LIGHT_INK), // orange
        tertiary: accent(SATURATED_RED, LIGHT_INK), // vivid red
        quaternary: accent(SATURATED_GREEN, LIGHT_INK), // kelly green
        quinary: accent(SATURATED_YELLOW, LIGHT_INK), // sunny yellow
        senary: accent("#7b2ff7", LIGHT_LABEL_LIGHT), // electric purple — light label
        septenary: accent("#00bcd4", LIGHT_INK), // cyan
        octonary: accent("#ff2e88", LIGHT_INK), // hot magenta
      },
      // Status colors reuse the soft semantic family (their dark-mode accent
      // twins) — pale neons read as soft status fills on white.
      context: {
        negative: context(SOFT_CORAL),
        warning: context(SOFT_YELLOW),
        positive: context(SOFT_GREEN),
        info: context(SOFT_BLUE),
        neutral: context("#c8c1c0"), // pastel warm gray
      },
      antialiasing: false,
    },
  },

  // Per-component appearance defaults. Spreads the structural base sizes, then
  // tunes the Button for this theme so it reads as one settled control:
  //   • `size: 1.5rem` — the box's em-base (NOT the visible text size). The
  //     height and paddings below derive from it.
  //   • `height: 2em` → 3rem, exactly the box `djui-input-base` sets, so buttons
  //     line up with the inputs beside them.
  //   • `paddingX: 1rem` — the side padding, matching the form family's fixed
  //     `1rem` gutter (an absolute value: a fixed inset at any control height).
  //   • `labelSize: max(0.5em, 0.75rem)` → 0.75rem at the default `size`, the
  //     label type size. Decoupled from the box em-base so the text stays small
  //     while the control stays tall; the `em` half means a consumer scaling
  //     `size` up scales the text with it, while the `rem` floor keeps the
  //     label (and the 1em-of-label icon riding it) legible on reduced-`size`
  //     buttons instead of shrinking in lockstep with the box.
  // Net: a 3rem-tall button, 1rem side padding, 0.75rem uppercase label — and a
  // single-knob scale is still available (a theme/consumer expressing paddingX
  // in `em` too gets height + padding + text all riding `size`). `size`,
  // `height`, `paddingX`, `labelSize` are build-time CSS knobs; `props` are the
  // runtime treatment defaults (delivered through `configureComponentDefaults`)
  // — a bare `<Button>` renders the solid accent fill, while an explicit
  // `variant`/`color` (including `variant="plain"`) still wins. `color` names
  // `accent-default` — the semantic pointer — rather than a literal accent, so
  // the default follows whichever accent the theme designates as its default.
  components: {
    ...baseConfig.components,
    Button: {
      ...baseConfig.components?.Button,
      size: "1.5rem",
      height: "2em",
      paddingX: "1rem",
      labelSize: "max(0.5em, 0.75rem)",
      props: { variant: "solid", color: "accent-default" },
    },
  },

  // Font-sizes are stored unitless — a bare multiplier the `djui-typography()`
  // reader scales by its `$unit` (default `1em`, so the ramp tracks its
  // ancestor's size context; `1rem` pins it absolute). There is no `button-label`
  // variant: the button text wears the `label` voice (same case/weight/tracking)
  // with `white-space: nowrap` added at the Button call site — nowrap is layout,
  // not typographic voice — and its size is Button's own `labelSize` knob.
  typography: {
    title: { fontSize: 1.5, fontWeight: 700, lineHeight: 1.2 },
    heading: { fontSize: 1.25, fontWeight: 600, lineHeight: 1.3 },
    subheading: { fontSize: 1, fontWeight: 600, lineHeight: 1.4 },
    label: { fontSize: 0.75, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" },
    body: { fontSize: 1, lineHeight: 1.5 },
    small: { fontSize: 0.875 },
    caption: { fontSize: 0.75 },
    numeric: { fontVariantNumeric: "tabular-nums", fontWeight: 500 },
    code: {
      fontFamily: "ui-monospace, \"SF Mono\", Menlo, monospace",
      fontSize: 0.75,
    },
  },
};
