/**
 * djui configuration types.
 * The config is the single source of truth for colors, surfaces, and typography.
 */

export interface DjuiColorVariations {
  light?: number;
  dark?: number;
  amount?: number;
}

/**
 * The interaction (hover / active) state shift — how far a filled control moves
 * when hovered or pressed. Emitted as mode-baked `--djui-<color>-hover-rgb` /
 * `-active-rgb` tokens (the fills read these directly, no per-mode branch), so
 * light and dark move the *same relative amount* — the fix for the old fixed-%
 * shift, which was ~0.6 of a level step in dark but ~1.75 in light.
 *
 * Surfaces are **ramp-relative**: the shift is a fraction of the distance to the
 * neighbouring level (dark mode lightens toward the next level, light mode
 * darkens toward the previous), so it self-scales through an ease-out ramp and
 * never lands on the backdrop. Accents and contexts have no ramp, so they take a
 * fixed perceptual `colorAmount` (a `scaleLightness` %) in the same direction.
 */
export interface DjuiInteraction {
  /** Surface hover: fraction of the way to the neighbouring level (default `0.667` — ⅔). */
  hover?: number;
  /** Surface active: fraction toward the neighbour (default `1.333` — 4/3, overshoots the next level). */
  active?: number;
  /**
   * A multiplier applied to the surface `hover`/`active` fractions in the
   * *darkening* direction only — i.e. light mode (and single light-mode themes).
   * Light surface ramps are typically lower-contrast than dark ones, so ⅔ of a
   * light step reads fainter than ⅔ of a dark step; this lets light push harder
   * without touching dark. Default `1.75`; set `1` for a theme whose light ramp
   * is already punchy. Does not affect accents/contexts (they use `colorAmount`).
   */
  lightMultiplier?: number;
  /** Accent/context hover shift, a `scaleLightness` percentage (default `8`); active is `2×`. */
  colorAmount?: number;
}

export interface DjuiColorDefinition {
  value: string;
  variations?: DjuiColorVariations;
  /** Contrasting foreground color for use on top of this color */
  contrast?: string;
}

export type DjuiEasing =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | [number, number, number, number];

/**
 * The surface color scale, ramp form — the levels interpolated `from → to`
 * through an easing curve. Level 1 is the scale's base: the ink separators and
 * segmented-surface frames are drawn in, and the default form-control fill.
 */
export interface DjuiSurfaceRampConfig {
  from: string;
  to: string;
  levels?: number;
  easing?: DjuiEasing;
  variations?: DjuiColorVariations;
  /** How many "next" levels to track beyond current (default: 4) */
  lookahead?: number;
}

/**
 * The surface color scale, explicit form — every level verbatim, in order
 * (the level count is the array length). This is what makes non-monotonic
 * scales expressible — e.g. an alternating palette whose levels swap between
 * two tone families. An alternating palette should still drift (each
 * recurrence of a tone slightly different from the last) so that references
 * more than one step apart stay distinguishable.
 */
export interface DjuiSurfaceLevelsConfig {
  /** The level colors, index 0 = level 1 (the scale's base). */
  colors: string[];
  variations?: DjuiColorVariations;
  /** How many "next" levels to track beyond current (default: 4) */
  lookahead?: number;
}

export type DjuiSurfaceColorConfig = DjuiSurfaceRampConfig | DjuiSurfaceLevelsConfig;

export interface DjuiModeColorConfig {
  surface: DjuiSurfaceColorConfig;
  /**
   * The page background, as an explicit override. `html` paints
   * `rgb(var(--djui-backdrop-rgb, var(--djui-surface-0-rgb)))`: undeclared, the
   * page is the generated ground — level 0, one ramp step below the scale's
   * base — so it sits below anything a region can pin, by rule. Declaring a
   * backdrop only repaints the page; level 0 stays the floor the relative
   * channels (`previous-surface-k`) clamp to. Outside the context cascade.
   */
  backdrop?: string | DjuiColorDefinition;
  foreground: {
    primary: string | DjuiColorDefinition;
    contrast: string;
  };
  accent?: Record<string, string | DjuiColorDefinition>;
  context?: Record<string, string | DjuiColorDefinition>;
  /**
   * Apply -webkit/-moz font-smoothing in this mode's CSS block.
   * Defaults: `light` → `false`, `dark` → `true`.
   */
  antialiasing?: boolean;
}

/**
 * Every color domain — `accent`, `context`, `surface`, `foreground`, `form`,
 * `antialiasing` — may be declared either:
 * - at root level (the **shared-across-modes baseline**) — emitted under
 *   `:root`, applies regardless of `data-djui-mode`; or
 * - per-mode (`light` / `dark`) — emitted under `html[data-djui-mode="..."]`,
 *   where a domain set inside a mode slot **overrides or supplements** the root
 *   for that mode (the per-mode block layers on top of `:root`).
 *
 * A theme that shares a domain across modes declares it once at root; a theme
 * whose modes diverge (djui's default — 90s-neon dark vs neo-brutalist light)
 * declares it per-mode. `accent`/`context` are therefore **optional at root** —
 * a fully mode-divergent theme omits them here and supplies them in both slots.
 * Single-mode consumers (e.g. the REAPER theme) declare colors at root level and
 * omit the mode slots entirely.
 */
export interface DjuiColorsConfig {
  /** Root-level accent set — the shared-across-modes baseline. Optional: a theme may instead declare accents per-mode. */
  accent?: Record<string, string | DjuiColorDefinition>;
  /** Root-level context set — the shared-across-modes baseline. Optional: a theme may instead declare context per-mode. */
  context?: Record<string, string | DjuiColorDefinition>;
  /** Root-level surface scale. Mutually exclusive with `light`/`dark` in practice, though all three may coexist (per-mode wins for its mode). */
  surface?: DjuiSurfaceColorConfig;
  /** Root-level page background — see `DjuiModeColorConfig.backdrop`. */
  backdrop?: string | DjuiColorDefinition;
  /** Root-level foreground. */
  foreground?: {
    primary: string | DjuiColorDefinition;
    contrast: string;
  };
  /**
   * Root-level font-smoothing toggle. Applies under `:root` so it's
   * mode-agnostic. Default `false` — opt in for dark-leaning single-mode
   * themes (e.g. the REAPER theme sets this to `true`).
   */
  antialiasing?: boolean;
  light?: DjuiModeColorConfig;
  dark?: DjuiModeColorConfig;
}

export interface DjuiTypographyVariant {
  /**
   * A **unitless** size multiplier (e.g. `0.75`, `1.5`), emitted as
   * `--djui-typography-<name>-font-size`. The `djui-typography()` reader scales it
   * by its `$unit` (default `1em` — the ramp tracks its ancestor's size; `1rem`
   * pins it absolute), so the em/rem basis is chosen at the call site, never baked
   * into the token. Omit it for a size-agnostic voice (the label of a sized
   * control): the variant then contributes case/weight/tracking only and the size
   * inherits.
   */
  fontSize?: number | string;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: string;
  textTransform?: string;
  fontVariantNumeric?: string;
  whiteSpace?: string;
  fontStyle?: string;
  textDecoration?: string;
  /**
   * An opt-in role color, emitted as `--djui-typography-<name>-color` and applied
   * by the `djui-typography()` reader. The color system is the usual home for ink;
   * this is for a theme that wants a role to carry its own muted color (a dimmed
   * `subheading`/`body`) as part of the voice, without reaching into components.
   */
  color?: string;
  [key: string]: string | number | undefined;
}

/**
 * A separator width — the surface system's cell divider (the frame's fill
 * showing through `djui-surface-layout`'s gap). A CSS length string (e.g.
 * `"0"`, `"0.125rem"`), or a per-axis pair; `"0"` disables the separator on
 * that axis. The ink the lines are drawn in defaults to the scale's base and
 * is configured separately (`separatorColor` / `components.<Name>.separatorColor`).
 */
export type DjuiSeparatorValue = string | { row?: string; column?: string };
/** @deprecated Pre-rename spelling of `DjuiSeparatorValue`; removed after one release. */
export type DjuiHairlineValue = DjuiSeparatorValue;

/**
 * A viewport-responsive CSS length: a plain value, or a map from `base` (below
 * every band) and breakpoint names (`small`, `large`, …) to values. The
 * generator emits the `base` entry under `:root` and each breakpoint entry
 * under the matching `width-from` media query (in the breakpoint registry's
 * ascending order, so wider bands win on the cascade). A map without `base`
 * leaves the token undeclared below its narrowest band — the consuming
 * `var()` chain's built-in default applies there.
 */
export type DjuiResponsiveValue = string | Record<string, string>;

/**
 * Per-component default values — the highest config precedence tier. Keyed by
 * component name (e.g. `Badge`, `Button`, `Icon`); `size` is a rem CSS value,
 * the rest (`strokeWidth`, `trackSize`, …) are themable per-component knobs.
 *
 * The grammar: every scalar key emits a `:root` token
 * `--djui-component-<name>--<key>`, both sides kebab-cased, with a **double
 * dash** marking the name↔prop boundary (`components.TextInput.size` →
 * `--djui-component-text-input--size`; `Icon.strokeWidth` →
 * `--djui-component-icon--stroke-width`). Emission is mechanical — a new scalar
 * key needs no generator change. The component's `var()` fallback chain (in its
 * SCSS) references that token; an instance prop sets the same token inline, so
 * it wins by specificity — prop and component-config default share one var.
 * (`colors` and `separator` are the two structured exceptions; see below.)
 */
export interface DjuiComponentDefaults {
  /** Component size as a rem CSS value (e.g. "0.75rem") — `--djui-component-<name>--size`. */
  size?: string;
  /** SVG stroke width in viewBox units (icons) — `--djui-component-<name>--stroke-width`. */
  strokeWidth?: number;
  /**
   * A stated control height — emitted as `--djui-component-<name>--height`,
   * the top of the height `var()` chain (component → the form family's
   * `componentGroups.form.height` → the built-in `2em`). On form controls it
   * retunes the box `djui-input-base` sets; on Button it *opts into* the
   * set-height model (unset, a button's box stays emergent — padding derives
   * its height; icon-only buttons always pin, defaulting to the same `2em`).
   */
  height?: string;
  /**
   * The control's side padding — emitted as
   * `--djui-component-<name>--padding-x`, the top of the padding chain
   * (component → family → the built-in `calc(0.25rem + 0.25em)`; Button's own
   * floor is `0.625em`). Independent of `size`/`height`, so a theme can hold a
   * fixed side padding across em-derived control heights.
   */
  paddingX?: string;
  /**
   * The label/content type size, emitted as
   * `--djui-component-<name>--label-size`. Only Button reads it today: it routes
   * the value into the composed IconLabel's content-size seam
   * (`--djui-component-icon-label--label-size`), which sizes the icon+label group
   * independently of the button's own `font-size` (the box em-base) — so a theme
   * can pair small label text with a tall control without the height/padding em
   * math shrinking. Defaults to `1em` (tracks the box, so one knob still scales
   * height, padding, and text together); dial it below `1em` for smaller text at
   * the same box, or give a `rem` value to pin the label size absolute. The
   * default theme sets `0.5em` (0.75rem of the 1.5rem button size — the label
   * type size). Icon-only buttons reset the seam, keeping a box-scaled glyph.
   */
  labelSize?: string;
  /**
   * The component's separator width (per axis or both) — emitted as
   * `--djui-component-<name>--separator(-row/-column)`, the top of the separator
   * `var()` chain (`djui-separator-width()` in helpers.scss). Only meaningful on the
   * segmented-surface components (Accordion, AuthTemplate, DashboardTemplate,
   * HorizontalTable, Repeater, Table, Toolbar).
   */
  separator?: DjuiSeparatorValue;
  /**
   * The component's separator ink — the segmented frame's fill, which the
   * layout gaps reveal as the divider lines. A surface color token name
   * (e.g. `"surface-2"`), emitted as
   * `--djui-component-<name>--separator-color-rgb: var(--djui-<token>-rgb)`,
   * the top of the `djui-separator-color()` chain. Unconfigured, the chain
   * bottoms out at the scale's base (`surface-1`).
   */
  separatorColor?: string;
  /** @deprecated Use `separator`; accepted one release. */
  hairline?: DjuiSeparatorValue;
  /** @deprecated Use `separatorColor`; accepted one release. */
  hairlineColor?: string;
  /**
   * The component's surface corner radius — emitted as
   * `--djui-component-<name>--surface-radius`, the top of the radius `var()`
   * chain (component → global `surfaceRadius` → the built-in `0.5rem`).
   */
  surfaceRadius?: string;
  /**
   * The component's surface padding — emitted as
   * `--djui-component-<name>--surface-padding`, the top of the padding `var()`
   * chain (component → global `surfacePadding` → the built-in `1rem`).
   */
  surfacePadding?: string;
  /**
   * The minimum height of a data/key-value row's cells (Table, HorizontalTable)
   * — emitted as `--djui-component-<name>--row-min-height`, read by the cell's
   * `min-height` with a hard floor in the Visual's `var()` fallback. One shared
   * knob per table so both components size their rows the same.
   */
  rowMinHeight?: string;
  /**
   * Arrow size (the rotated-square side) for floating components with an arrow
   * (Tooltip, Popout) — emitted as `--djui-component-<name>--arrow-size`, read by
   * the arrow Visual. A floating family may instead share this via `componentGroups`.
   */
  arrowSize?: string;
  /**
   * A framed overlay's distance from the viewport's top and bottom edges
   * (Modal) — emitted as `--djui-component-<name>--offset`; the frame's
   * padding above and below the window, and so the window's height cap. The
   * `offsetSmall` twin is the value under the `small` band.
   */
  offset?: string;
  offsetSmall?: string;
  /**
   * A framed overlay's side gutter (Modal) — emitted as
   * `--djui-component-<name>--gutter`; the frame's padding at the sides, which
   * the window fills up to its width. `gutterSmall` is the `small`-band value.
   */
  gutter?: string;
  gutterSmall?: string;
  // A framed overlay's named window widths are the breakpoints themselves
  // (`width="small"` reads the `small` band length), so there is no
  // per-component width scale to state here — retune `breakpoints`, or give
  // an instance a literal length.
  /**
   * Component-scoped colors — token references with an optional per-mode
   * `light`/`dark` override, emitted as `--djui-component-<name>--color-<role>-rgb`.
   * The per-component twin of `componentGroups.<group>.colors`. See `DjuiScopedColors`.
   */
  colors?: DjuiScopedColors;
  /**
   * Runtime prop defaults — the *class-driven* appearance treatments that can't
   * ride a CSS custom property (a Field's `theme: 'floating'`, a Button's
   * `variant`/`color`). Unlike every other key here, `props` does **not** emit a
   * token: it is delivered to the runtime through `configureComponentDefaults`
   * (`djui/scripts`), and a generated component reads it via `componentDefault`
   * when its own prop is unset. Each value is the prop's literal default; a
   * component's own prop (including an opt-out like `'plain'`/`'none'`) always
   * wins. The generator skips this key.
   */
  props?: DjuiComponentProps;
  [key: string]: string | number | DjuiScopedColors | DjuiSeparatorValue | DjuiComponentProps | undefined;
}

/**
 * A component's runtime prop defaults — prop name → its default value. The
 * class-driven appearance treatments carried by `DjuiComponentDefaults.props`
 * (delivered at runtime, not emitted as tokens). Two value shapes:
 * - a **string**, the enumerated treatment case (`'floating'`, `'solid'`,
 *   `'accent-default'`), resolved through `componentDefault`;
 * - a **boolean**, a flag treatment (`rounded: true` for every Button, Stepper
 *   or Pagination), resolved through `componentDefaultFlag`; or
 * - an **attribute record**, a props seam (a table's `headerCellProps`, e.g.
 *   `{ ...setSurface(2) }` to default every header cell to a pinned surface
 *   level), resolved through `componentDefaultRecord` and shallow-merged under
 *   the instance's own record (instance keys win).
 * One resolver per shape, each returning exactly its own type, so the generated
 * conditions that compare a resolved value stay sound.
 */
export type DjuiComponentProps = Record<string, string | boolean | Record<string, unknown>>;

/**
 * A scoped color set for a component or component-group — colors a component
 * owns but that live *outside* the palette `colors` scope (because they are a
 * component concern, not a palette one). Each entry is a **token reference**
 * (e.g. `"accent-default"`, `"surface-1"`), emitted as
 * `--djui-<scope>--color-<role>-rgb`, where `<scope>` is the tier-marked,
 * kebab-cased name (`component-group-form`, `component-tooltip`) and the
 * `color-` prop segment mirrors this `colors` key. Root keys apply in both
 * modes; the optional `light`/`dark` sub-objects override per mode (the same
 * "root default, per-mode override" shape the palette uses). A single-mode theme
 * (no `light`/`dark` color blocks) only ever sees the root values.
 *
 * Roles: `focus` → `--djui-<scope>--color-focus-rgb`; `accent` (the form
 * family's CSS `accent-color` idea — the checked/active control fill) →
 * `--djui-<scope>--color-accent-rgb`; `inputBackground` →
 * `--djui-<scope>--color-input-background-rgb` (camelCase kebab-cases, words in
 * full — never `bg`). Any other key follows the same rule. Each role also
 * emits a `-contrast` twin resolving through the referenced token's contrast
 * channel (global foreground contrast as the inner fallback), so a role used
 * as a solid fill carries its readable ink. A role referencing a surface
 * level (`"surface-N"`) additionally emits a `-next` channel (base plus the
 * `-hover`/`-active` interaction pair) pointing one level up the scale,
 * ladder-clamped — the fill a part reading as a segment *of* the role-filled
 * box derives from (the number input's triggers against the form family's
 * `inputBackground`; see `djui-background-field-segment`).
 */
export interface DjuiScopedColorOverrides {
  /**
   * The form family's optional second fill, for the inert `nonInteractive`
   * twins of the text-entry controls: unset, a read-only field fills like a
   * live one; set (typically one level off the context where `inputBackground`
   * is two — `"previous-surface-1"` in dark, `"next-surface-1"` in light), the
   * read-only state becomes visible. No kit default by design.
   */
  inputBackgroundNonInteractive?: string;
  [role: string]: string | undefined;
}
export interface DjuiScopedColors {
  /** Per-mode overrides of the root color roles. */
  light?: DjuiScopedColorOverrides;
  dark?: DjuiScopedColorOverrides;
  /** Root color roles (apply in both modes). */
  [role: string]: string | DjuiScopedColorOverrides | undefined;
}

/**
 * Shared defaults for a family of components (the middle config tier;
 * generalizes the former flat `form` collection). Keyed by group name (e.g.
 * `form`, whose members are TextInput/NativeSelect/Textarea). Same grammar as
 * `DjuiComponentDefaults`, one tier down: every scalar key emits
 * `--djui-component-group-<name>--<key>`. The group's `size` becomes
 * `--djui-component-group-form--size`, which a member's `var()` chain falls back
 * to below its own component var — so retuning it once moves the whole family,
 * unless a component pins its own value.
 */
export interface DjuiComponentGroupDefaults {
  /** Family size as a rem CSS value — `--djui-component-group-<name>--size`. */
  size?: string;
  /**
   * The members' control height — `--djui-component-group-<name>--height`.
   * The form family's controls read it below their per-component token and
   * above the built-in `2em`, so one value moves every control's box while
   * `size` keeps moving the type.
   */
  height?: string;
  /**
   * The members' side padding — `--djui-component-group-<name>--padding-x`,
   * read below the per-component token and above the built-in
   * `calc(0.25rem + 0.25em)`. A knob of its own so the em coupling can be
   * broken family-wide (e.g. a fixed `1rem` at every scale). Also feeds an
   * `InputGroup`'s position-derived edge paddings.
   */
  paddingX?: string;
  /**
   * The members' corner radius — `--djui-component-group-<name>--radius`,
   * read by the controls and by `InputGroup` (built-in `0.5rem`). Fixed, not
   * em-derived, so corners hold across sizes.
   */
  radius?: string;
  /**
   * Group-scoped colors (focus ring, input background, …) — token references with
   * an optional per-mode `light`/`dark` override. See `DjuiScopedColors`.
   */
  colors?: DjuiScopedColors;
  /**
   * Runtime prop defaults for the family — the class-driven / runtime treatments
   * that can't ride a CSS custom property (the peer of `DjuiComponentDefaults.props`,
   * one tier up). Delivered to the runtime through `configureComponentDefaults` and
   * read via `componentDefault('component-group-<name>', '<prop>')` when a member's
   * own prop is unset — e.g. a portaled overlay family's default `surface` level,
   * which has to reach the element as a literal attribute, not a token. The
   * generator skips this key.
   */
  props?: DjuiComponentProps;
  [key: string]: string | number | DjuiScopedColors | DjuiComponentProps | undefined;
}

/**
 * A shadow's color: a literal CSS color, or a palette-token reference with an
 * alpha — emitted as `rgba(var(--djui-<token>-rgb), <alpha>)`, so the color
 * follows the referenced token wherever it resolves.
 */
export type DjuiShadowColorValue = string | { token: string; alpha?: number };

/**
 * A shadow token whose color is theme-aware. `lengths` is the geometry
 * (`"<offset-x> <offset-y> <blur> [spread]"`); `color` is the root default
 * (the "root default, per-mode override" shape the scoped colors use), with
 * optional `light`/`dark` overrides. The composed `--djui-shadow-<name>` var
 * references the emitted `--djui-shadow-<name>-color` part, which each mode
 * block re-declares — so one token renders with a different color basis per
 * mode (e.g. cast from the surface base in dark mode, from the foreground ink
 * in light mode).
 */
export interface DjuiShadowDefinition {
  /** The length parts: offset-x, offset-y, blur, optional spread. */
  lengths: string;
  /** Root color default (right for dark and single-mode themes). */
  color: DjuiShadowColorValue;
  /** Light-mode color override. */
  light?: DjuiShadowColorValue;
  /** Dark-mode color override. */
  dark?: DjuiShadowColorValue;
}

/**
 * Global alpha scale — the opacity steps the fill/selectable mixins reference
 * (emitted as `--djui-alpha-*` at `:root`). Components read these via a
 * re-seeded `--djui-current-alpha-*` context, so they carry no literal alphas;
 * a component instance can still override per-component via
 * `--djui-component-<name>--alpha-*`. `soft*` = the foreground/neutral tint ramp,
 * `tint*` = the colored/accent tint ramp, `idle` = dimmed (unselected) text.
 */
export interface DjuiAlphaConfig {
  /**
   * The alpha unit (`--djui-alpha-unit`, default 1/16). Every alpha the kit
   * paints is an integer number of units — a step stated per tier
   * (`components.<Name>.fillAlpha` / `.idleAlpha`, `componentGroups.<group>.fillAlpha`)
   * over the kit's floors — so a coarser unit re-means every step at once, the
   * way a level means a different colour per theme. No semantic sub-keys.
   */
  unit?: number;
  /** @deprecated The pre-2026-08-29 hand-picked decimals; still emitted as `--djui-alpha-*` for one release, read by nothing in the kit. */
  soft?: number;
  /** @deprecated See `soft`. */
  softHover?: number;
  /** @deprecated See `soft`. */
  softActive?: number;
  /** @deprecated See `soft`. */
  tint?: number;
  /** @deprecated See `soft`. */
  tintHover?: number;
  /** @deprecated See `soft`. */
  tintActive?: number;
  /** @deprecated See `soft`. */
  idle?: number;
}

/**
 * One face of a font family — a single weight/style, backed by a self-hosted
 * woff2 file. The generator emits an `@font-face` whose `src` resolves relative
 * to the compiled stylesheet (`url("./fonts/<filename>")`); the per-theme build
 * copies the file into `dist/themes/<name>/fonts/` (source: `src/themes/fonts/<name>/`).
 * `weight`/`style`/`display`/`sizeAdjust` fall back to the family's defaults when
 * omitted (a variation only states what differs — usually just `filename` + `weight`).
 */
export interface DjuiFontVariation {
  /** The woff2 file name, resolved from the theme's font directory. */
  filename: string;
  /** `font-weight` for this face (default: family `weight`, else `400`). */
  weight?: number | string;
  /** `font-style` for this face (default: family `style`, else `"normal"`). */
  style?: string;
  /** `font-display` for this face (default: family `display`, else `"swap"`). */
  display?: string;
  /** `size-adjust` for this face (default: family `sizeAdjust`). See the family field. */
  sizeAdjust?: string | number;
  /** `ascent-override` for this face (default: family `ascentOverride`). See the family field. */
  ascentOverride?: string | number;
  /** `descent-override` for this face (default: family `descentOverride`). See the family field. */
  descentOverride?: string | number;
  /** `line-gap-override` for this face (default: family `lineGapOverride`). See the family field. */
  lineGapOverride?: string | number;
}

/**
 * One font family the theme loads — keyed by family name in `DjuiFontConfig.families`,
 * so the name is never restated. The CSS stack is **computed**: the family name
 * (the map key, implied first) followed by `fallbacks`; entries containing a space
 * are auto-quoted. `style`/`display`/`sizeAdjust` set family-wide defaults that any
 * `variation` may override. Load the faces either by self-hosting (`variations`,
 * preferred) or by Google Fonts (`google`, convenience).
 */
export interface DjuiFontFamily {
  /**
   * Fallback families appended after this family in the computed stack (the family
   * name itself is implied first). Generic keywords (`sans-serif`) and system
   * fonts (`system-ui`) sit here as bare strings; multi-word names are quoted
   * automatically. Omit for a bare single-family stack.
   */
  fallbacks?: string[];
  /** Family-wide `font-style` default for its variations. */
  style?: string;
  /** Family-wide `font-display` default for its variations. */
  display?: string;
  /**
   * Family-wide `size-adjust` default (a percentage, e.g. `"172%"`; a bare number
   * is treated as a percent). `size-adjust` scales **only this family's** glyphs,
   * so a face that renders small (Dongle) can be enlarged to sit at the fallback's
   * visual size — without touching the fallback (which bumping `typography.*.fontSize`
   * would do). It also narrows the metric gap between web font and fallback,
   * reducing layout shift on swap. Because it scales the intrinsic line metrics too,
   * pair it with the `*Override` descriptors to keep `line-height: normal` sane. A
   * variation may override per-face.
   */
  sizeAdjust?: string | number;
  /**
   * Family-wide line-box metric overrides (each a percentage of the font size;
   * a bare number is treated as a percent). They redefine the face's ascent,
   * descent, and line-gap — i.e. the metrics that drive `line-height: normal` —
   * **for this family only**, leaving the fallback's own line box untouched
   * (unlike a `line-height` on the element, which hits whichever font renders).
   *
   * `sizeAdjust` scales these too (final metric = override × sizeAdjust), so a
   * face that ships a tall intrinsic line box (Dongle: ascent 850 + descent 598
   * = 1.448 em, blown up to ~2.17 em once `sizeAdjust: 172%` scales it) can be
   * brought back to a sane `normal` without shrinking the glyphs. A variation may
   * override per-face.
   */
  ascentOverride?: string | number;
  descentOverride?: string | number;
  lineGapOverride?: string | number;
  /** Self-hosted faces (preferred) — emitted as `@font-face`, files copied to dist. */
  variations?: DjuiFontVariation[];
  /**
   * Google Fonts reference (convenience) — emits an `@import` for this family
   * instead of self-hosting. (A CSS `@import` must lead the stylesheet; djui's
   * shipped themes self-host, so the concatenated `djui.css` never relies on that
   * ordering — use this in a config you compile yourself.)
   */
  google?: { weights?: (number | string)[]; display?: string };
}

/**
 * The theme's font system. `families` is the registry of every font the theme
 * loads (each → `@font-face` rules + a `--djui-font-<slug>` stack token); `default`
 * picks the base typeface (emitted as `--djui-font-default`, a `var()` to a family
 * token) — either a `families` key or a raw CSS stack string (a theme that loads no
 * font). Font stacks are tokens like colors: a typography variant may reference a
 * family via `var(--djui-font-<slug>)`.
 */
export interface DjuiFontConfig {
  /** The base typeface: a `families` key, or a raw CSS `font-family` stack. */
  default: string;
  /** Every font family the theme loads, keyed by family name. */
  families?: Record<string, DjuiFontFamily>;
}

export interface DjuiConfig {
  colors: DjuiColorsConfig;
  /**
   * The theme-wide **default accent** — the semantic fallback color for anything
   * accent-tinted that doesn't name its own color: the form focus ring, link
   * text, and any component whose `color` is left unset. A token reference (e.g.
   * `"accent-primary"`, the default; or `"accent-secondary"`, a context color,
   * etc.), resolved per-mode through the referenced token. The generator emits it
   * as the full `--djui-accent-default-*-rgb` channel set (base + contrast + the
   * variation ramp), so `accent-default` is itself usable anywhere a color token
   * is — `var(--djui-accent-default-rgb)` and `color="accent-default"` alike.
   * Retarget it once here to repoint every default-accent surface at a stroke.
   */
  accentDefault?: string;
  /**
   * The theme's font system (theme-owned; the base face was previously hardcoded
   * in `global.scss`). Either a `DjuiFontConfig` (a `families` registry + a
   * `default` typeface) or a plain stack string as shorthand for
   * `{ default: "<stack>" }` (a theme that loads no font). The resolved `default`
   * is emitted as `--djui-font-default` (read by `global.scss`), and each family as
   * a `--djui-font-<slug>` token. The per-variant `fontFamily` on a
   * `DjuiTypographyVariant` (e.g. `code`) still overrides this for that variant.
   */
  font?: DjuiFontConfig | string;
  typography?: Record<string, DjuiTypographyVariant>;
  /** Per-component defaults (highest config precedence). */
  components?: Record<string, DjuiComponentDefaults>;
  /** Shared per-family defaults (the middle tier; replaces the flat `form`). */
  componentGroups?: Record<string, DjuiComponentGroupDefaults>;
  /**
   * The named responsive bands, each a rem CSS length (e.g. `small: "45rem"`).
   * Compile-time by necessity — media queries cannot consume CSS custom
   * properties — so the generator emits these as the `$djui-breakpoints` SCSS
   * map in the generated config partial (read by `styles/helpers` through the
   * `djui-config` seam); themes with different breakpoints recompile the CSS,
   * which the per-theme build matrix already does. `baseConfig` carries the
   * canonical five bands (`xsmall`–`xlarge`).
   */
  breakpoints?: Record<string, string>;
  /**
   * The theme-wide separator width (per axis or both) — the surface system's
   * cell-divider default, emitted as `--djui-separator(-row/-column)` under
   * `:root` when configured. A per-component `components.<Name>.separator`
   * overrides it via the separator `var()` chain; unconfigured, the chain
   * bottoms out at the built-in `0.0625rem`.
   */
  separator?: DjuiSeparatorValue;
  /**
   * The theme-wide separator ink — a surface color token name (e.g.
   * `"surface-2"`), emitted as
   * `--djui-separator-color-rgb: var(--djui-<token>-rgb)` under `:root`. A
   * per-component `components.<Name>.separatorColor` overrides it via the
   * `djui-separator-color()` chain; unconfigured, the chain bottoms out at the
   * scale's base (`surface-1`) — the maximum-contrast default.
   */
  separatorColor?: string;
  /** @deprecated Use `separator`; accepted one release. */
  hairline?: DjuiSeparatorValue;
  /** @deprecated Use `separatorColor`; accepted one release. */
  hairlineColor?: string;
  /**
   * The theme-wide surface corner radius — emitted as `--djui-surface-radius`
   * under `:root` (per-breakpoint entries under their media queries). A
   * per-component `components.<Name>.surfaceRadius` overrides it via the
   * radius `var()` chain; unconfigured, the chain bottoms out at the built-in
   * `0.5rem`.
   */
  surfaceRadius?: DjuiResponsiveValue;
  /**
   * The theme-wide surface padding — emitted as `--djui-surface-padding`
   * under `:root` (per-breakpoint entries under their media queries). A
   * per-component `components.<Name>.surfacePadding` overrides it via the
   * padding `var()` chain; unconfigured, the chain bottoms out at the
   * built-in `1rem`.
   */
  surfacePadding?: DjuiResponsiveValue;
  alpha?: DjuiAlphaConfig;
  /**
   * The interaction (hover/active) state shift for filled controls. Always
   * emitted (defaults `hover: 0.667`, `active: 1.333`, `colorAmount: 8`); a theme
   * tunes the strength here. See `DjuiInteraction`.
   */
  interaction?: DjuiInteraction;
  /**
   * Box-shadow design tokens, keyed by name. Each value is either a standard
   * `box-shadow` string (single shadow, optional spread, no `inset`,
   * `rgb[a]()`/`hsl[a]()`/hex/keyword color) or a `DjuiShadowDefinition`,
   * whose color is a theme-token reference resolvable per mode. The generator
   * emits, per token, a composed convenience var `--djui-shadow-<name>` plus
   * the parsed parts (`--djui-shadow-<name>-{offset-x,offset-y,blur,spread?,color}`)
   * so the `djui-shadow($name, $rotation)` mixin can recompose them at any
   * rotation.
   */
  shadows?: Record<string, string | DjuiShadowDefinition>;
  /**
   * The stacking order — the one place raw `z-index` integers live. Emitted
   * under `:root` as `--djui-layer-<name>: <integer>;` in the order given, so a
   * component references a rung by name (`var(--djui-layer-overlay)`) rather than
   * a bare number. `baseConfig` carries the canonical ladder — sticky chrome
   * below drawers below the modal below the portaled transient panels (popout,
   * menu, listbox) below the tooltip — as consecutive
   * whole integers with no gaps (a new rung renumbers the scale rather than
   * slotting into a reserved gap). A theme may retune it, but the ordering is the
   * contract every overlay depends on.
   */
  layers?: Record<string, number>;
}
