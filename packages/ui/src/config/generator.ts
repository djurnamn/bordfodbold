import type { DjuiConfig, DjuiColorDefinition, DjuiColorVariations, DjuiEasing, DjuiSeparatorValue, DjuiInteraction, DjuiModeColorConfig, DjuiResponsiveValue, DjuiShadowColorValue, DjuiShadowDefinition, DjuiSurfaceColorConfig, DjuiFontConfig, DjuiFontFamily, DjuiScopedColors, DjuiScopedColorOverrides } from "./types";
import { baseConfig } from "./base";

// ─── Color utilities ───

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function scaleLightness(rgb: [number, number, number], amount: number): [number, number, number] {
  return rgb.map((channel) => {
    if (amount > 0) {
      return Math.round(channel + (255 - channel) * (amount / 100));
    }
    return Math.round(channel + channel * (amount / 100));
  }) as [number, number, number];
}

function lerp(from: [number, number, number], to: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t),
  ];
}

function rgb(values: [number, number, number]): string {
  return `${values[0]}, ${values[1]}, ${values[2]}`;
}

// ─── Easing ───

const NAMED_EASINGS: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};

function resolveEasing(easing?: DjuiEasing): [number, number, number, number] {
  if (!easing) return NAMED_EASINGS.linear;
  if (Array.isArray(easing)) return easing;
  return NAMED_EASINGS[easing] ?? NAMED_EASINGS.linear;
}

/**
 * Attempt to solve for t given x using cubic bezier.
 * Uses Newton-Raphson method.
 */
function cubicBezier(t: number, p1: number, p2: number): number {
  // B(t) = 3(1-t)^2*t*p1 + 3(1-t)*t^2*p2 + t^3
  return 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t;
}

function solveBezierX(x: number, x1: number, x2: number): number {
  // Newton-Raphson to find t for given x
  let t = x;
  for (let i = 0; i < 8; i++) {
    const currentX = cubicBezier(t, x1, x2) - x;
    const derivative = 3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
    if (Math.abs(derivative) < 1e-7) break;
    t -= currentX / derivative;
    t = Math.max(0, Math.min(1, t));
  }
  return t;
}

function applyEasing(x: number, easing: [number, number, number, number]): number {
  const [x1, y1, x2, y2] = easing;
  if (x1 === 0 && y1 === 0 && x2 === 1 && y2 === 1) return x; // linear
  const t = solveBezierX(x, x1, x2);
  return cubicBezier(t, y1, y2);
}

// ─── Helpers ───

function resolveColor(def: string | DjuiColorDefinition): { value: string; variations?: DjuiColorVariations; contrast?: string } {
  if (typeof def === "string") return { value: def };
  return def;
}

const LIGHT_NAMES = ["light", "lighter", "lightest"];
const DARK_NAMES = ["dark", "darker", "darkest"];

function lightName(step: number): string {
  return LIGHT_NAMES[step - 1] ?? `light-${step}`;
}

function darkName(step: number): string {
  return DARK_NAMES[step - 1] ?? `dark-${step}`;
}

function generateVariationVars(
  baseRgb: [number, number, number],
  prefix: string,
  variations: DjuiColorVariations | undefined,
): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!variations) return vars;

  const amount = variations.amount ?? 5;
  for (let i = 1; i <= (variations.light ?? 0); i++) {
    vars[`${prefix}-${lightName(i)}-rgb`] = rgb(scaleLightness(baseRgb, i * amount));
  }
  for (let i = 1; i <= (variations.dark ?? 0); i++) {
    vars[`${prefix}-${darkName(i)}-rgb`] = rgb(scaleLightness(baseRgb, -(i * amount)));
  }
  return vars;
}

// ─── Interaction (hover / active) state shift ───

/** The direction a mode's fills recede on interaction: dark mode lightens, light darkens. */
type InteractionDirection = "lighten" | "darken";

interface ResolvedInteraction {
  hover: number;
  active: number;
  lightMultiplier: number;
  colorAmount: number;
}

/** Interaction config with defaults filled in (always emitted, like `alpha`). */
function resolveInteraction(interaction?: DjuiInteraction): ResolvedInteraction {
  return {
    hover: interaction?.hover ?? 0.667,
    active: interaction?.active ?? 1.333,
    lightMultiplier: interaction?.lightMultiplier ?? 1.75,
    colorAmount: interaction?.colorAmount ?? 8,
  };
}

/** The interaction names, appended to the variation list so the relative
 *  surface tokens (`next-surface-N-hover`, `current-surface-active`, …) emit. */
const INTERACTION_NAMES = ["hover", "active"] as const;

/** Like `lerp` but clamps each channel to [0,255] — `active` uses `t > 1` (overshoot). */
function lerpClamped(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
): [number, number, number] {
  return from.map((c, i) =>
    Math.max(0, Math.min(255, Math.round(c + (to[i] - from[i]) * t))),
  ) as [number, number, number];
}

/**
 * Ramp-relative interaction tokens (`-hover-rgb` / `-active-rgb`) for one surface
 * level: the shift is a fraction of the distance to the mode's neighbouring level
 * (`lighten` → the next level up, `darken` → the previous), so it self-scales
 * through an ease-out ramp. At a ramp end (no neighbour that way) the neighbour is
 * mirrored one step past the edge, so an edge-level chip still reacts.
 *
 * In the darkening (light-mode) direction the fractions are scaled by
 * `lightMultiplier`, since a light ramp's steps are typically shallower than a
 * dark one's — so ⅔ of a light step would otherwise read fainter than ⅔ of a
 * dark step.
 */
function surfaceInteractionVars(
  levels: [number, number, number][],
  index: number,
  prefix: string,
  direction: InteractionDirection,
  interaction: ResolvedInteraction,
): Record<string, string> {
  const level = levels[index];
  const mirror = (other: [number, number, number]): [number, number, number] =>
    [0, 1, 2].map((c) => 2 * level[c] - other[c]) as [number, number, number];
  let neighbour: [number, number, number];
  if (levels.length < 2) {
    neighbour = level;
  } else if (direction === "lighten") {
    neighbour = index + 1 < levels.length ? levels[index + 1] : mirror(levels[index - 1]);
  } else {
    neighbour = index - 1 >= 0 ? levels[index - 1] : mirror(levels[index + 1]);
  }
  const scale = direction === "darken" ? interaction.lightMultiplier : 1;
  return {
    [`${prefix}-hover-rgb`]: rgb(lerpClamped(level, neighbour, interaction.hover * scale)),
    [`${prefix}-active-rgb`]: rgb(lerpClamped(level, neighbour, interaction.active * scale)),
  };
}

/**
 * Fixed-amount interaction tokens for a non-ramp color (accent / context): a
 * `scaleLightness` shift in the mode's direction, `active` twice the hover — so a
 * saturated hue's hover/press read as strongly as a surface's.
 */
function colorInteractionVars(
  base: [number, number, number],
  prefix: string,
  direction: InteractionDirection,
  interaction: ResolvedInteraction,
): Record<string, string> {
  const sign = direction === "lighten" ? 1 : -1;
  return {
    [`${prefix}-hover-rgb`]: rgb(scaleLightness(base, sign * interaction.colorAmount)),
    [`${prefix}-active-rgb`]: rgb(scaleLightness(base, sign * interaction.colorAmount * 2)),
  };
}

/** The mode direction for root-declared colors: single-mode themes bake their one
 *  mode; a dual-mode theme's shared root falls back to its surface-ramp lightness. */
function inferRootDirection(config: DjuiConfig): InteractionDirection {
  const { colors } = config;
  if (colors.dark && !colors.light) return "lighten";
  if (colors.light && !colors.dark) return "darken";
  if (colors.surface) {
    const levels = resolveSurfaceLevelColors(colors.surface);
    const mean = levels.reduce((s, [r, g, b]) => s + (r + g + b) / 3, 0) / levels.length;
    return mean < 128 ? "lighten" : "darken";
  }
  return "lighten";
}

// ─── Surface generation ───

/** The scale's level count — the array length (explicit form) or `levels` (ramp form). */
function surfaceLevelCount(config: DjuiSurfaceColorConfig): number {
  return "colors" in config ? config.colors.length : (config.levels ?? 8);
}

/** The ladder's top level across every declared surface scale (root, light,
 *  dark) — the clamp the cascade rules and the derived scoped-color channels
 *  share. `0` when the config declares no surface scale at all. */
function configSurfaceLevelCount(config: DjuiConfig): number {
  const sources: DjuiSurfaceColorConfig[] = [];
  if (config.colors.surface) sources.push(config.colors.surface);
  if (config.colors.light) sources.push(config.colors.light.surface);
  if (config.colors.dark) sources.push(config.colors.dark.surface);
  return sources.length === 0 ? 0 : Math.max(...sources.map(surfaceLevelCount));
}

/**
 * The scale's level colors as RGB triplets, index 0 = level 1. The explicit
 * form is taken verbatim; the ramp form lerps `from → to` through its easing.
 */
function resolveSurfaceLevelColors(config: DjuiSurfaceColorConfig): [number, number, number][] {
  if ("colors" in config) return config.colors.map(hexToRgb);
  const from = hexToRgb(config.from);
  const to = hexToRgb(config.to);
  const levels = config.levels ?? 8;
  const easing = resolveEasing(config.easing);
  return Array.from({ length: levels }, (_, index) => {
    const x = levels === 1 ? 0 : index / (levels - 1);
    return lerp(from, to, applyEasing(x, easing));
  });
}

/** Level 0 as a triplet: level 1 minus the first step (clamped to the channel
 *  range), or level 1 itself when the scale has a single level. */
function surfaceGround(levels: [number, number, number][]): [number, number, number] {
  if (levels.length < 2) return levels[0];
  const [first, second] = levels;
  return [0, 1, 2].map((c) => Math.min(255, Math.max(0, Math.round(2 * first[c] - second[c])))) as [number, number, number];
}

// The ink a surface-family token pairs with when it is read as a *colour* —
// `color="surface-2"` on a solid Button, a tinted Popout, any reader of
// `--djui-current-color-contrast-rgb`. A surface level is a neutral fill on the
// theme's own ramp, built to host body text, so its contrast channel is the
// body ink — a pointer, not a computed value, so it resolves per mode with the
// foreground it names. Without the channel every such reader fell through to
// `foreground-contrast` (the ink for an *accent* fill): white on light grey.
const SURFACE_CONTRAST = "var(--djui-foreground-primary-rgb)";

function generateSurfaceLevels(
  config: DjuiSurfaceColorConfig,
  direction: InteractionDirection,
  interaction: ResolvedInteraction,
): Record<string, string> {
  const vars: Record<string, string> = {};
  const levels = resolveSurfaceLevelColors(config);

  // Level 0 — the ground. Always generated, never authored: level 1 extended
  // one step *below* by the scale's own first-step delta, so it is darker than
  // the base by exactly one ramp step in both modes (a light ramp runs from its
  // strongest grey upward, so "below" is darker there too). It is what `html`
  // paints when a theme states no `backdrop`, and the floor the relative
  // channels clamp to (`previous-surface-k` on level 1 or 2 reaches it), so a
  // recessed input or a separator on the lowest levels still has somewhere to
  // go. It is not a level a region can pin — `data-djui-set-surface` starts at
  // 1 — which is the whole point: the page sits one step below anything
  // pinnable, by rule rather than by theme discipline. A one-level scale has
  // no step to extend by and grounds on itself.
  const ground = surfaceGround(levels);
  vars["--djui-surface-0-rgb"] = rgb(ground);
  vars["--djui-surface-0-contrast-rgb"] = SURFACE_CONTRAST;
  Object.assign(vars, generateVariationVars(ground, "--djui-surface-0", config.variations));
  Object.assign(vars, surfaceInteractionVars([ground, ...levels], 0, "--djui-surface-0", direction, interaction));

  levels.forEach((levelRgb, index) => {
    const level = index + 1;
    vars[`--djui-surface-${level}-rgb`] = rgb(levelRgb);
    vars[`--djui-surface-${level}-contrast-rgb`] = SURFACE_CONTRAST;

    // Structural sub-variations (also feed the hatch pattern).
    Object.assign(vars, generateVariationVars(levelRgb, `--djui-surface-${level}`, config.variations));
    // Ramp-relative interaction shift (mode-baked toward the neighbouring level).
    Object.assign(vars, surfaceInteractionVars(levels, index, `--djui-surface-${level}`, direction, interaction));
  });

  return vars;
}

// ─── Accent generation ───

function generateAccentColors(
  accent: Record<string, string | DjuiColorDefinition>,
  direction: InteractionDirection,
  interaction: ResolvedInteraction,
): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [name, def] of Object.entries(accent)) {
    const { value, variations, contrast } = resolveColor(def);
    const base = hexToRgb(value);
    vars[`--djui-accent-${name}-rgb`] = rgb(base);
    Object.assign(vars, generateVariationVars(base, `--djui-accent-${name}`, variations));
    Object.assign(vars, colorInteractionVars(base, `--djui-accent-${name}`, direction, interaction));
    if (contrast) {
      vars[`--djui-accent-${name}-contrast-rgb`] = rgb(hexToRgb(contrast));
    }
  }

  return vars;
}

/**
 * The theme-wide default accent (`config.accentDefault`, default `accent-primary`)
 * emitted as a complete `--djui-accent-default-*-rgb` channel set that **points**
 * at the referenced token's channels. Pointers, not values, so it resolves
 * per-mode wherever the target does (a per-mode accent stays per-mode) and stays a
 * single retarget point. The channel list mirrors a full accent color (base +
 * contrast + the three-up/three-down ramp), so `accent-default` is usable
 * anywhere a color token is — including the `colorVar` seam (`color="accent-default"`).
 */
function defaultAccentTokens(ref: string): string[] {
  const suffixes = ["", "-contrast", "-light", "-lighter", "-lightest", "-dark", "-darker", "-darkest", "-hover", "-active"];
  return suffixes.map((s) => `--djui-accent-default${s}-rgb: var(--djui-${ref}${s}-rgb);`);
}

// ─── Scoped component/group colors (focus ring, input background, …) ───

/** A `colors` role key → its `--djui-<scope>-color-<role>-rgb` token segment:
 *  camelCase kebab-cased, words spelled in full (no abbreviations — e.g.
 *  `inputBackground` → `input-background`, never `input-bg`). */
function colorRole(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * The `--djui-<scope>--color-<role>-rgb` lines from every group/component `colors`
 * block, for one emission context: `root` (the root roles, shared across modes) or
 * a mode (`light`/`dark`, the per-mode overrides). Scope is the tier-marked,
 * kebab-cased name (`component-group-form` / `component-tooltip`); each role value
 * is a token reference (resolved per-mode wherever the referenced token is). The
 * `color-` segment mirrors the config path (`<scope>.colors.<role>`) — this is the
 * single home for colors a component owns but that sit outside the palette
 * `colors` scope. The tier prefix (`component-group-` / `component-`) keeps a
 * like-named group and component from ever colliding.
 *
 * Each role also emits its `-contrast` twin, resolving through the referenced
 * token's contrast channel with the global foreground contrast as the inner
 * fallback — the same pairing the runtime color seam applies to an explicit
 * `color` prop, so a role that lands as a solid fill (the form family's
 * `accent`, coloring the checked/active controls) always carries a readable
 * ink alongside it. Roles never read as a fill simply never have their twin
 * consulted.
 *
 * A role whose reference names a surface level (`surface-N`) additionally
 * emits its `-next` channel — `-next-rgb` plus the `-next-hover-rgb` /
 * `-next-active-rgb` interaction pair — pointing one level up the scale,
 * ladder-clamped. This is how a part that reads as a segment *of* a
 * role-filled box (the number input's triggers against the form family's
 * `inputBackground` field fill) derives its fill from the box instead of from
 * the ambient context: the relationship holds at any nesting depth because
 * both ends are anchored to the configured level. The channel follows the
 * emission context: a mode whose override references a different surface
 * level re-derives it there, while a mode whose override is not a surface
 * level (the default light theme's `foreground-contrast` input background)
 * keeps the outermost derivable channel — resolved through the mode's own
 * scale, since the emission is a pointer, not a value.
 */
// ─── Relative surface references ───
//
// A colour role may name a level *relative to its context* instead of an
// absolute `surface-N`: `current-surface`, `previous-surface-k`,
// `next-surface-k`, or the two recession channels. Decided 2026-08-28:
//
//   recessed-surface — the fill of a *box* that should read sunk into its
//     context: two levels away in the preferred (downward) direction, and
//     when the ladder has no room there, two levels the other way — never a
//     clamp, which would land on the context itself. Candidates in order:
//     L−2, L+2, L−1, L+1, the first that exists (0 … top).
//   raised-surface — the mirror: L+2, L−2, L+1, L−1.
//
// Lines (separators) use no channel of their own: `previous-surface-2`, which
// clamps at the ground (`max(0, L−2)`), is the rule for them — a separator's
// host is always level 1 or above, so the target is always strictly below it
// and there is nothing to flip away from. In one line: lines recess and clamp
// at the ground; boxes need two steps and flip when they can't get them.
//
// The resolution happens per pinned level in the cascade, not at `:root`: a
// custom property declared at the root with a `var()` inside is substituted
// there and inherited already-resolved, so a root-declared
// `--…: var(--djui-recessed-surface-rgb)` would freeze level 1's answer for
// every nested context. Instead, each mode block emits one alias *per level*
// (`…-level-<L>-rgb`, an absolute reference the rule resolves to for that
// level in that mode), and every level block of the cascade re-points the
// live token at its own level's alias — so the substitution happens on the
// pinned element, per mode, per depth, with plain inheritance doing the rest.
const RELATIVE_SURFACE = /^(current-surface|previous-surface-(\d+)|next-surface-(\d+)|recessed-surface|raised-surface)$/;

function isRelativeSurface(ref: string): boolean {
  return RELATIVE_SURFACE.test(ref);
}

function firstExistingLevel(candidates: number[], maxLevels: number): number {
  for (const c of candidates) if (c >= 0 && c <= maxLevels) return c;
  return 0;
}

/** The level a relative reference resolves to for a context pinned at `level`
 *  on a ladder of `maxLevels` (level 0, the ground, always exists). */
function resolveRelativeSurface(ref: string, level: number, maxLevels: number): number {
  const m = ref.match(RELATIVE_SURFACE);
  if (!m) throw new Error(`Not a relative surface reference: ${ref}`);
  if (ref === "current-surface") return level;
  if (ref === "recessed-surface") return firstExistingLevel([level - 2, level + 2, level - 1, level + 1], maxLevels);
  if (ref === "raised-surface") return firstExistingLevel([level + 2, level - 2, level + 1, level - 1], maxLevels);
  if (m[2] !== undefined) return Math.max(0, level - Number(m[2]));
  return Math.min(maxLevels, level + Number(m[3]));
}

/** The per-level alias lines for one level-resolved colour token: for each
 *  pinnable level, the absolute reference the rule resolves to in this mode
 *  (an absolute `ref` maps every level to itself, so a role relative in one
 *  mode and absolute in the other still resolves through the same names). With
 *  `derived`, the scoped-colour twins ride along: `-contrast`, and the `-next`
 *  channel (plus its interaction pair) one level up, ladder-clamped. */
function levelAliasLines(prefix: string, ref: string, maxLevels: number, derived: boolean): string[] {
  const lines: string[] = [];
  for (let level = 1; level <= maxLevels; level++) {
    const token = isRelativeSurface(ref) ? `surface-${resolveRelativeSurface(ref, level, maxLevels)}` : ref;
    lines.push(`${prefix}-level-${level}-rgb: var(--djui-${token}-rgb);`);
    if (!derived) continue;
    lines.push(`${prefix}-level-${level}-contrast-rgb: var(--djui-${token}-contrast-rgb, var(--djui-foreground-contrast-rgb));`);
    const surfaceReference = token.match(/^surface-(\d+)$/);
    const nextToken = surfaceReference ? `surface-${Math.min(Number(surfaceReference[1]) + 1, maxLevels)}` : token;
    for (const channel of ["", "-hover", "-active"]) {
      lines.push(`${prefix}-level-${level}-next${channel}-rgb: var(--djui-${nextToken}${channel}-rgb);`);
    }
  }
  return lines;
}

/** The re-pointing lines a cascade level block emits for one level-resolved
 *  token: the live name → this level's alias. */
function levelIndirectionLines(prefix: string, level: number, derived: boolean): string[] {
  const lines = [`  ${prefix}-rgb: var(${prefix}-level-${level}-rgb);`];
  if (derived) {
    lines.push(`  ${prefix}-contrast-rgb: var(${prefix}-level-${level}-contrast-rgb);`);
    for (const channel of ["", "-hover", "-active"]) {
      lines.push(`  ${prefix}-next${channel}-rgb: var(${prefix}-level-${level}-next${channel}-rgb);`);
    }
  }
  return lines;
}

interface LevelResolvedToken { prefix: string; derived: boolean }

/** Every colour token the config states with a relative surface reference in
 *  any mode — the scoped colour roles and the separator colours — as the
 *  token prefixes the cascade re-points per level. */
function levelResolvedTokens(config: DjuiConfig): LevelResolvedToken[] {
  const out: LevelResolvedToken[] = [];
  const scoped = (scope: string, colors: DjuiScopedColors | undefined) => {
    if (!colors) return;
    const roles = new Set<string>();
    for (const [key, ref] of Object.entries(colors)) {
      if (key === "light" || key === "dark") {
        for (const [k, r] of Object.entries((ref as DjuiScopedColorOverrides) ?? {})) if (typeof r === "string" && isRelativeSurface(r)) roles.add(k);
      } else if (typeof ref === "string" && isRelativeSurface(ref)) roles.add(key);
    }
    for (const role of roles) out.push({ prefix: `--djui-${scope}--color-${colorRole(role)}`, derived: true });
  };
  for (const [group, defaults] of Object.entries(config.componentGroups ?? {})) scoped(`component-group-${kebabCase(group)}`, defaults.colors);
  for (const [name, defaults] of Object.entries(config.components ?? {})) {
    scoped(`component-${kebabCase(name)}`, defaults.colors);
    const sep = (defaults.separatorColor ?? defaults.hairlineColor) as string | undefined;
    if (sep && isRelativeSurface(sep)) out.push({ prefix: `--djui-component-${kebabCase(name)}--separator-color`, derived: false });
  }
  const rootSep = config.separatorColor ?? config.hairlineColor;
  if (rootSep && isRelativeSurface(rootSep)) out.push({ prefix: "--djui-separator-color", derived: false });
  return out;
}

function scopedColorLines(config: DjuiConfig, mode: "root" | "light" | "dark"): string[] {
  const lines: string[] = [];
  const maxSurfaceLevel = configSurfaceLevelCount(config);
  const levelResolved = new Set<string>();
  const collect = (scope: string, colors: DjuiScopedColors | undefined) => {
    if (!colors) return;
    for (const [key, ref] of Object.entries(colors)) {
      if (key === "light" || key === "dark") {
        for (const [k, r] of Object.entries((ref as DjuiScopedColorOverrides) ?? {})) if (typeof r === "string" && isRelativeSurface(r)) levelResolved.add(`${scope}|${k}`);
      } else if (typeof ref === "string" && isRelativeSurface(ref)) levelResolved.add(`${scope}|${key}`);
    }
  };
  for (const [group, defaults] of Object.entries(config.componentGroups ?? {})) collect(`component-group-${kebabCase(group)}`, defaults.colors);
  for (const [name, defaults] of Object.entries(config.components ?? {})) collect(`component-${kebabCase(name)}`, defaults.colors);
  const emit = (scope: string, colors: DjuiScopedColors | undefined): void => {
    if (!colors) return;
    const source = mode === "root" ? colors : (colors[mode] as DjuiScopedColorOverrides | undefined);
    if (!source) return;
    for (const [key, ref] of Object.entries(source)) {
      // At root, `light`/`dark` are the per-mode sub-objects, not roles — skip them.
      if (mode === "root" && (key === "light" || key === "dark")) continue;
      if (typeof ref !== "string") continue;
      // A role that is relative in any mode resolves per level (see the
      // relative-surface notes above): this block emits its per-level aliases
      // and the cascade's level blocks own the live token.
      if (levelResolved.has(`${scope}|${key}`)) {
        lines.push(...levelAliasLines(`--djui-${scope}--color-${colorRole(key)}`, ref, maxSurfaceLevel, true));
        continue;
      }
      lines.push(`--djui-${scope}--color-${colorRole(key)}-rgb: var(--djui-${ref}-rgb);`);
      lines.push(`--djui-${scope}--color-${colorRole(key)}-contrast-rgb: var(--djui-${ref}-contrast-rgb, var(--djui-foreground-contrast-rgb));`);
      const surfaceReference = ref.match(/^surface-(\d+)$/);
      if (surfaceReference !== null && maxSurfaceLevel > 0) {
        const nextLevel = Math.min(Number(surfaceReference[1]) + 1, maxSurfaceLevel);
        for (const channel of ["", "-hover", "-active"]) {
          lines.push(`--djui-${scope}--color-${colorRole(key)}-next${channel}-rgb: var(--djui-surface-${nextLevel}${channel}-rgb);`);
        }
      }
    }
  };
  for (const [group, defaults] of Object.entries(config.componentGroups ?? {})) {
    emit(`component-group-${kebabCase(group)}`, defaults.colors);
  }
  for (const [name, defaults] of Object.entries(config.components ?? {})) {
    emit(`component-${kebabCase(name)}`, defaults.colors);
  }
  return lines;
}

// ─── Backdrop generation ───

/** The page-background token (`--djui-backdrop-rgb`, plus variations when
 *  declared). Outside the context cascade — see `DjuiModeColorConfig.backdrop`. */
function generateBackdropColor(backdrop: string | DjuiColorDefinition): Record<string, string> {
  const vars: Record<string, string> = {};
  const { value, variations } = resolveColor(backdrop);
  const base = hexToRgb(value);
  vars["--djui-backdrop-rgb"] = rgb(base);
  vars["--djui-backdrop-contrast-rgb"] = SURFACE_CONTRAST;
  Object.assign(vars, generateVariationVars(base, "--djui-backdrop", variations));
  return vars;
}

// ─── Context generation ───

function generateContextColors(
  context: Record<string, string | DjuiColorDefinition>,
  direction: InteractionDirection,
  interaction: ResolvedInteraction,
): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [name, def] of Object.entries(context)) {
    const { value, variations, contrast } = resolveColor(def);
    const base = hexToRgb(value);
    vars[`--djui-context-${name}-rgb`] = rgb(base);
    Object.assign(vars, generateVariationVars(base, `--djui-context-${name}`, variations));
    Object.assign(vars, colorInteractionVars(base, `--djui-context-${name}`, direction, interaction));
    if (contrast) {
      vars[`--djui-context-${name}-contrast-rgb`] = rgb(hexToRgb(contrast));
    }
  }
  return vars;
}

// ─── Foreground generation ───

function generateForegroundColors(fg: DjuiModeColorConfig["foreground"]): Record<string, string> {
  const vars: Record<string, string> = {};
  const { value: primaryValue, variations } = resolveColor(fg.primary);
  const primaryRgb = hexToRgb(primaryValue);

  vars["--djui-foreground-primary-rgb"] = rgb(primaryRgb);
  Object.assign(vars, generateVariationVars(primaryRgb, "--djui-foreground-primary", variations));
  vars["--djui-foreground-contrast-rgb"] = rgb(hexToRgb(fg.contrast));

  return vars;
}

// ─── Shadow tokens ───

interface ParsedShadow {
  offsetX: string;
  offsetY: string;
  blur: string;
  spread?: string;
  color: string;
}

/** Lengths must carry a unit for `calc()` (a bare `0` can't add to a length). */
function normalizeLength(value: string): string {
  return value === "0" ? "0px" : value;
}

/**
 * Parse a `box-shadow` string into its parts. Supports a single shadow with 2–4
 * lengths (offset-x offset-y [blur] [spread]) and a trailing color
 * (`rgb[a]()`/`hsl[a]()`/hex/keyword); `inset` and comma-separated lists are out
 * of scope (djui's tokens don't use them).
 */
function parseShadow(value: string): ParsedShadow {
  const trimmed = value.trim();
  const colorMatch = trimmed.match(
    /(rgba?\([^)]*\)|hsla?\([^)]*\)|#[0-9a-fA-F]{3,8}|[a-zA-Z][\w-]*)\s*$/
  );
  const color = colorMatch ? colorMatch[1] : "currentColor";
  const lengthsPart = (colorMatch ? trimmed.slice(0, colorMatch.index) : trimmed).trim();
  const lengths = lengthsPart.split(/\s+/).filter(Boolean).map(normalizeLength);
  const [offsetX = "0px", offsetY = "0px", blur = "0px", spread] = lengths;
  return { offsetX, offsetY, blur, spread, color };
}

/** A shadow color value as CSS: a literal passes through; a token reference
 *  becomes `rgb[a](var(--djui-<token>-rgb)[, <alpha>])`. */
function shadowColorCss(value: DjuiShadowColorValue): string {
  if (typeof value === "string") return value;
  return value.alpha !== undefined
    ? `rgba(var(--djui-${value.token}-rgb), ${value.alpha})`
    : `rgb(var(--djui-${value.token}-rgb))`;
}

/**
 * Per-shadow token lines for one emission context.
 *
 * `root`: every shadow emits its parsed parts plus the composed convenience
 * var. A plain-string shadow composes verbatim (so existing
 * `var(--djui-shadow-<name>)` consumers see the exact authored value); a
 * `DjuiShadowDefinition` composes from its parts with the color as a
 * `var(--djui-shadow-<name>-color)` reference, so a mode block can swap the
 * color basis by re-declaring that one part.
 *
 * `light`/`dark`: only the `-color` part lines, for definitions carrying that
 * mode's override.
 */
function shadowTokenLines(
  shadows: Record<string, string | DjuiShadowDefinition>,
  mode: "root" | "light" | "dark",
): string[] {
  const lines: string[] = [];
  for (const [name, value] of Object.entries(shadows)) {
    if (mode !== "root") {
      if (typeof value === "string") continue;
      const override = value[mode];
      if (override === undefined) continue;
      lines.push(`--djui-shadow-${name}-color: ${shadowColorCss(override)};`);
      continue;
    }

    if (typeof value === "string") {
      const s = parseShadow(value);
      lines.push(`--djui-shadow-${name}: ${value};`);
      lines.push(`--djui-shadow-${name}-offset-x: ${s.offsetX};`);
      lines.push(`--djui-shadow-${name}-offset-y: ${s.offsetY};`);
      lines.push(`--djui-shadow-${name}-blur: ${s.blur};`);
      if (s.spread !== undefined) lines.push(`--djui-shadow-${name}-spread: ${s.spread};`);
      lines.push(`--djui-shadow-${name}-color: ${s.color};`);
      continue;
    }

    const lengths = value.lengths.trim().split(/\s+/).filter(Boolean).map(normalizeLength);
    const [offsetX = "0px", offsetY = "0px", blur = "0px", spread] = lengths;
    lines.push(`--djui-shadow-${name}-offset-x: ${offsetX};`);
    lines.push(`--djui-shadow-${name}-offset-y: ${offsetY};`);
    lines.push(`--djui-shadow-${name}-blur: ${blur};`);
    if (spread !== undefined) lines.push(`--djui-shadow-${name}-spread: ${spread};`);
    lines.push(`--djui-shadow-${name}-color: ${shadowColorCss(value.color)};`);
    const composedLengths = [offsetX, offsetY, blur, ...(spread !== undefined ? [spread] : [])].join(" ");
    lines.push(`--djui-shadow-${name}: ${composedLengths} var(--djui-shadow-${name}-color);`);
  }
  return lines;
}

/**
 * The stacking-ladder tokens — `--djui-layer-<name>: <integer>;` in config order.
 * This is the one place raw `z-index` integers are emitted; components reference
 * a rung by name so the ordering lives in exactly one authored ladder.
 */
function layerTokenLines(layers: Record<string, number>): string[] {
  return Object.entries(layers).map(([name, value]) => `--djui-layer-${name}: ${value};`);
}

// ─── Responsive tokens (surface radius / padding) ───

/**
 * One responsive token's emission: the `base` (or plain-string) value as a
 * `:root` line, plus a `min-width` media section per breakpoint entry —
 * iterated in the breakpoint registry's ascending order, so wider bands
 * override narrower ones on the cascade. The `calc(<band> + 1px)` lower bound
 * matches the `width-from` helper's semantics.
 */
function responsiveTokenEmission(
  token: string,
  value: DjuiResponsiveValue,
  breakpoints: Record<string, string>,
): { rootLines: string[]; mediaSections: string[] } {
  if (typeof value === "string") {
    return { rootLines: [`${token}: ${value};`], mediaSections: [] };
  }
  const rootLines = value.base !== undefined ? [`${token}: ${value.base};`] : [];
  const mediaSections: string[] = [];
  for (const [band, width] of Object.entries(breakpoints)) {
    const bandValue = value[band];
    if (bandValue === undefined) continue;
    mediaSections.push(
      `@media (min-width: calc(${width} + 1px)) {\n  :root {\n    ${token}: ${bandValue};\n  }\n}`
    );
  }
  return { rootLines, mediaSections };
}

// ─── Separator tokens ───

/**
 * The separator token lines for one scope — `<prefix>` is `--djui-separator`
 * (root) or `--djui-<component>-separator` (a `components.<Name>.separator`).
 * A string value emits the axis-agnostic token; a per-axis pair emits only the
 * declared axes. The `djui-separator-width()` chain in helpers.scss reads these in
 * component-per-axis → component → global-per-axis → global order, bottoming
 * out at the built-in `0.0625rem` — so nothing is emitted for an unconfigured
 * scope and the output stays token-free.
 */
function separatorTokenLines(prefix: string, value: DjuiSeparatorValue): string[] {
  if (typeof value === "string") return [`${prefix}: ${value};`];
  const lines: string[] = [];
  if (value.row !== undefined) lines.push(`${prefix}-row: ${value.row};`);
  if (value.column !== undefined) lines.push(`${prefix}-column: ${value.column};`);
  return lines;
}

// ─── Component / group default tokens ───

/** camelCase / PascalCase → kebab-case (words in full, no abbreviations —
 *  `TextInput` → `text-input`, `strokeWidth` → `stroke-width`). */
function kebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * The `:root` token lines for one component/group `defaults` entry, under the
 * given `scope` (`component-<name>` or `component-group-<name>`). Generic and
 * mechanical: every scalar key emits `--djui-<scope>--<kebab key>` — no
 * per-key special cases. Three exceptions to the plain-scalar line:
 * `colors` is emitted elsewhere (scoped colors, `scopedColorLines`); `props` is
 * the runtime prop-default channel (delivered through `configureComponentDefaults`,
 * never a token) and is skipped like `colors`; `separator` keeps its per-axis
 * (`-row`/`-column`) expansion; a responsive-record value (an object) goes
 * through `responsiveTokenEmission`, its media sections pushed onto
 * `mediaSections`.
 */
function componentDefaultLines(
  scope: string,
  defaults: Record<string, unknown>,
  breakpoints: Record<string, string>,
  mediaSections: string[],
  maxSurfaceLevel: number,
): string[] {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(defaults)) {
    if (key === "colors" || key === "props" || value === undefined) continue;
    // `hairline` / `hairlineColor` are the pre-rename keys, accepted one release
    // and emitted under the new token names.
    const token = `--djui-${scope}--${kebabCase(key === "hairline" ? "separator" : key === "hairlineColor" ? "separatorColor" : key)}`;
    if (key === "separator" || key === "hairline") {
      lines.push(...separatorTokenLines(token, value as DjuiSeparatorValue));
    } else if (key === "separatorColor" || key === "hairlineColor") {
      // A surface color token name → an -rgb token referencing that level's
      // triple, read by the `djui-separator-color()` chain in helpers.scss. A
      // relative name resolves per level (aliases here, the live token in the
      // cascade's level blocks).
      if (isRelativeSurface(String(value))) {
        lines.push(...levelAliasLines(token, String(value), maxSurfaceLevel, false));
      } else {
        lines.push(`${token}-rgb: var(--djui-${value}-rgb);`);
      }
    } else if (typeof value === "object") {
      const emission = responsiveTokenEmission(token, value as DjuiResponsiveValue, breakpoints);
      lines.push(...emission.rootLines);
      mediaSections.push(...emission.mediaSections);
    } else {
      lines.push(`${token}: ${value};`);
    }
  }
  return lines;
}

// ─── Font loading ───

interface ResolvedFont {
  /**
   * `:root` font tokens: one `--djui-font-<slug>` per family (its computed stack)
   * plus `--djui-font-default` (the base typeface — a `var()` to a family token, or
   * an inline raw stack). Font stacks are tokens like colors, so both the document
   * default and any typography variant can reference a family by `var()`.
   */
  tokens: string[];
  /** `@font-face` blocks for self-hosted faces (valid anywhere in the sheet). */
  fontFaces: string[];
  /** `@import` lines for Google Fonts references (must precede other rules). */
  imports: string[];
}

/** A family/fallback name, quoted only if it contains whitespace (a multi-word name). */
function quoteFamilyName(name: string): string {
  return /\s/.test(name) ? `"${name}"` : name;
}

/** A family name as a custom-property slug: lowercased, whitespace → hyphens. */
function fontSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/** The computed CSS stack: the family name (implied) followed by its fallbacks. */
function computeStack(name: string, fallbacks?: string[]): string {
  return [name, ...(fallbacks ?? [])].map(quoteFamilyName).join(", ");
}

/** A font-metric descriptor value: a bare number becomes a percent; a string passes through. */
function percentValue(value: string | number): string {
  return typeof value === "number" ? `${value}%` : value;
}

/** The self-hosted `@font-face` rules for one family (each `src` relative to the stylesheet). */
function fontFaceRules(name: string, family: DjuiFontFamily): string[] {
  return (family.variations ?? []).map((variation) => {
    const style = variation.style ?? family.style ?? "normal";
    const display = variation.display ?? family.display ?? "swap";
    const sizeAdjust = variation.sizeAdjust ?? family.sizeAdjust;
    const ascentOverride = variation.ascentOverride ?? family.ascentOverride;
    const descentOverride = variation.descentOverride ?? family.descentOverride;
    const lineGapOverride = variation.lineGapOverride ?? family.lineGapOverride;
    const lines = [
      `  font-family: ${quoteFamilyName(name)};`,
      `  font-style: ${style};`,
      `  font-weight: ${variation.weight ?? 400};`,
      `  font-display: ${display};`,
    ];
    // Metric overrides before `size-adjust`, which scales them. Each redefines a
    // line-box metric for this face only, taming `line-height: normal` without
    // touching the fallback's metrics.
    if (ascentOverride !== undefined) lines.push(`  ascent-override: ${percentValue(ascentOverride)};`);
    if (descentOverride !== undefined) lines.push(`  descent-override: ${percentValue(descentOverride)};`);
    if (lineGapOverride !== undefined) lines.push(`  line-gap-override: ${percentValue(lineGapOverride)};`);
    if (sizeAdjust !== undefined) lines.push(`  size-adjust: ${percentValue(sizeAdjust)};`);
    lines.push(`  src: url("./fonts/${variation.filename}") format("woff2");`);
    return `@font-face {\n${lines.join("\n")}\n}`;
  });
}

/** One Google Fonts `@import` for a family loaded the convenience way. */
function googleFontImport(name: string, google: NonNullable<DjuiFontFamily["google"]>): string {
  const family = name.replace(/ /g, "+");
  const weights = (google.weights ?? [400]).join(";");
  const display = google.display ?? "swap";
  return `@import url("https://fonts.googleapis.com/css2?family=${family}:wght@${weights}&display=${display}");`;
}

/**
 * Resolve the `font` config (a `families` registry + a `default` typeface, or a
 * plain stack string) into its emittable parts: the `:root` font tokens
 * (`--djui-font-<slug>` per family + `--djui-font-default`), the self-hosted
 * `@font-face` rules, and any Google `@import`s.
 */
function resolveFont(font: DjuiFontConfig | string | undefined): ResolvedFont {
  if (!font) return { tokens: [], fontFaces: [], imports: [] };
  const config = typeof font === "string" ? { default: font } : font;
  const families = config.families ?? {};

  const tokens: string[] = [];
  const fontFaces: string[] = [];
  const imports: string[] = [];
  for (const [name, family] of Object.entries(families)) {
    // Each family's stack is a token, referenceable by the default and by any
    // typography variant (`var(--djui-font-<slug>)`).
    tokens.push(`--djui-font-${fontSlug(name)}: ${computeStack(name, family.fallbacks)};`);
    fontFaces.push(...fontFaceRules(name, family));
    if (family.google) imports.push(googleFontImport(name, family.google));
  }

  // `default` references its family token, or inlines a raw stack when it names no
  // family (a theme that loads no font).
  const declaredAsFamily = config.default in families;
  const defaultValue = declaredAsFamily ? `var(--djui-font-${fontSlug(config.default)})` : config.default;
  tokens.push(`--djui-font-default: ${defaultValue};`);

  return { tokens, fontFaces, imports };
}

// ─── Typography tokens ───

/**
 * Per-variant typography token lines — `--djui-typography-<name>-<channel>` for
 * every declared channel of each `config.typography` variant, read by the
 * hand-written `djui-typography()` reader (static, name-interpolated) and by the
 * `tokenSeam` runtime binder (IconLabel's `labelTypography`). The channel segment
 * is the kebab-cased config key (`fontWeight` → `font-weight`).
 *
 * `fontSize` is emitted **unitless** (a bare multiplier, e.g. `0.75`) — the
 * reader multiplies it by its `$unit` (`1em`/`1rem`, chosen at the call site), so
 * the em/rem basis is never baked into the token. Every other channel is emitted
 * verbatim (a font stack's commas are valid in a custom-property value).
 *
 * A variant that omits a channel emits no token for it: the reader's `var()` is
 * then undefined → invalid-at-computed-value → the (inherited) property falls
 * through. That is what gives a variant with no `fontSize` an inherited size —
 * "voice, not size" — at zero cost.
 */
function typographyTokenLines(
  typography: Record<string, Record<string, string | number | undefined>>,
): string[] {
  const lines: string[] = [];
  for (const [name, variant] of Object.entries(typography)) {
    for (const [prop, value] of Object.entries(variant)) {
      if (value === undefined) continue;
      const channel = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
      lines.push(`--djui-typography-${name}-${channel}: ${value};`);
    }
  }
  return lines;
}

// ─── CSS output ───

function cssBlock(selector: string, vars: Record<string, string>, extra?: string[]): string {
  const entries = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  const extraLines = extra ? extra.map((l) => `  ${l}`).join("\n") : "";
  const body = [entries, extraLines].filter(Boolean).join("\n");
  return `${selector} {\n${body}\n}`;
}

// ─── Token derivation ───

function collectAccentTokens(
  accent: Record<string, string | DjuiColorDefinition>,
  tokens: Set<string>
) {
  for (const [name, def] of Object.entries(accent)) {
    tokens.add(`accent-${name}`);
    const { variations } = resolveColor(def);
    if (variations) {
      for (let i = 1; i <= (variations.light ?? 0); i++) {
        tokens.add(`accent-${name}-${lightName(i)}`);
      }
      for (let i = 1; i <= (variations.dark ?? 0); i++) {
        tokens.add(`accent-${name}-${darkName(i)}`);
      }
    }
  }
}

function collectContextTokens(
  context: Record<string, string | DjuiColorDefinition>,
  tokens: Set<string>
) {
  for (const [name, def] of Object.entries(context)) {
    tokens.add(`context-${name}`);
    const { variations } = resolveColor(def);
    if (variations) {
      for (let i = 1; i <= (variations.light ?? 0); i++) {
        tokens.add(`context-${name}-${lightName(i)}`);
      }
      for (let i = 1; i <= (variations.dark ?? 0); i++) {
        tokens.add(`context-${name}-${darkName(i)}`);
      }
    }
  }
}

function collectSurfaceTokens(config: DjuiSurfaceColorConfig, tokens: Set<string>) {
  const levels = surfaceLevelCount(config);
  // Level 0 — the generated ground — is a colour token like any level (a theme
  // may name it in `separatorColor` or `inputBackground`); it is only not a
  // level a region can pin.
  for (let i = 0; i <= levels; i++) {
    tokens.add(`surface-${i}`);
    if (config.variations) {
      for (let j = 1; j <= (config.variations.light ?? 0); j++) {
        tokens.add(`surface-${i}-${lightName(j)}`);
      }
      for (let j = 1; j <= (config.variations.dark ?? 0); j++) {
        tokens.add(`surface-${i}-${darkName(j)}`);
      }
    }
  }
}

export function deriveColorTokens(config: DjuiConfig): string[] {
  const tokens = new Set<string>();
  const { colors } = config;

  // Accent (common + mode overrides). Root is optional — a mode-divergent
  // theme may declare accents only per-mode.
  if (colors.accent) collectAccentTokens(colors.accent, tokens);
  if (colors.light?.accent) collectAccentTokens(colors.light.accent, tokens);
  if (colors.dark?.accent) collectAccentTokens(colors.dark.accent, tokens);

  // Context
  if (colors.context) collectContextTokens(colors.context, tokens);
  if (colors.light?.context) collectContextTokens(colors.light.context, tokens);
  if (colors.dark?.context) collectContextTokens(colors.dark.context, tokens);

  // Surface — from whatever's defined (root, light, dark).
  if (colors.surface) collectSurfaceTokens(colors.surface, tokens);
  if (colors.light) collectSurfaceTokens(colors.light.surface, tokens);
  if (colors.dark) collectSurfaceTokens(colors.dark.surface, tokens);

  // Backdrop — the page background, when the theme separates it from the scale.
  if (colors.backdrop || colors.light?.backdrop || colors.dark?.backdrop) {
    tokens.add("backdrop");
  }

  // Foreground
  tokens.add("foreground-primary");
  const foregroundSources: ({ primary: string | DjuiColorDefinition } | undefined)[] = [
    colors.foreground,
    colors.light?.foreground,
    colors.dark?.foreground,
  ];
  for (const source of foregroundSources) {
    if (!source) continue;
    const { variations } = resolveColor(source.primary);
    if (!variations) continue;
    for (let i = 1; i <= (variations.light ?? 0); i++) {
      tokens.add(`foreground-primary-${lightName(i)}`);
    }
    for (let i = 1; i <= (variations.dark ?? 0); i++) {
      tokens.add(`foreground-primary-${darkName(i)}`);
    }
  }
  tokens.add("foreground-contrast");

  return [...tokens];
}

// ─── Surface system (data attribute rules) ───

function generateSurfaceSystemCSS(config: DjuiConfig): string {
  // Collect every surface definition present (root, light, dark) so we can
  // pick the max levels and lookahead across them.
  const surfaceSources: DjuiSurfaceColorConfig[] = [];
  if (config.colors.surface) surfaceSources.push(config.colors.surface);
  if (config.colors.light) surfaceSources.push(config.colors.light.surface);
  if (config.colors.dark) surfaceSources.push(config.colors.dark.surface);
  if (surfaceSources.length === 0) {
    return "";
  }

  const maxLevels = Math.max(...surfaceSources.map(surfaceLevelCount));
  const lookahead = Math.max(...surfaceSources.map((s) => s.lookahead ?? 4));
  // Variation names follow the first defined surface (root preferred, then light,
  // then dark), plus the always-emitted interaction names so the relative surface
  // tokens carry `-hover`/`-active` too (`next-surface-1-hover`, …).
  const variationNames = [...getVariationNames(surfaceSources[0].variations), ...INTERACTION_NAMES];
  const sections: string[] = [];

  // Helper: generate all CSS declarations for a given target level. The
  // `previous` channels clamp at level 0, the generated ground — so on the
  // lowest pinnable levels they still resolve to something *below* the
  // context rather than to the context itself; the `next` channels clamp at
  // the ladder's top.
  const resolvedTokens = levelResolvedTokens(config);
  function surfaceLevelDeclarations(level: number): string[] {
    const lines: string[] = [];
    // The recession channels — a box's sunk / lifted fill, two steps away and
    // flipping when the ladder has no room (see the relative-surface notes).
    const recessed = resolveRelativeSurface("recessed-surface", level, maxLevels);
    const raised = resolveRelativeSurface("raised-surface", level, maxLevels);
    lines.push(`  --djui-recessed-surface-rgb: var(--djui-surface-${recessed}-rgb);`);
    lines.push(`  --djui-raised-surface-rgb: var(--djui-surface-${raised}-rgb);`);
    for (const v of variationNames) {
      lines.push(`  --djui-recessed-surface-${v}-rgb: var(--djui-surface-${recessed}-${v}-rgb);`);
      lines.push(`  --djui-raised-surface-${v}-rgb: var(--djui-surface-${raised}-${v}-rgb);`);
    }
    // The level-resolved colour tokens the theme stated relatively: re-point
    // each at this level's alias, so it substitutes here rather than at root.
    for (const t of resolvedTokens) lines.push(...levelIndirectionLines(t.prefix, level, t.derived));

    for (let p = lookahead; p >= 1; p--) {
      lines.push(`  --djui-previous-surface-${p}-rgb: var(--djui-surface-${Math.max(0, level - p)}-rgb);`);
    }
    lines.push(`  --djui-current-surface-rgb: var(--djui-surface-${level}-rgb);`);
    for (let n = 1; n <= lookahead; n++) {
      lines.push(`  --djui-next-surface-${n}-rgb: var(--djui-surface-${Math.min(level + n, maxLevels)}-rgb);`);
    }

    for (const v of variationNames) {
      for (let p = lookahead; p >= 1; p--) {
        lines.push(`  --djui-previous-surface-${p}-${v}-rgb: var(--djui-surface-${Math.max(0, level - p)}-${v}-rgb);`);
      }
      lines.push(`  --djui-current-surface-${v}-rgb: var(--djui-surface-${level}-${v}-rgb);`);
      for (let n = 1; n <= lookahead; n++) {
        lines.push(`  --djui-next-surface-${n}-${v}-rgb: var(--djui-surface-${Math.min(level + n, maxLevels)}-${v}-rgb);`);
      }
    }

    return lines;
  }

  // Helper: a depth-N [data-djui-next-surface] chain with every ANCESTOR link
  // specificity-neutralized (`:where(...)`), so only the subject contributes —
  // every surface rule sits at (0,1,0) and SOURCE ORDER encodes precedence.
  // The flattening exists for one load-bearing guarantee: an element carrying
  // BOTH the authored step attribute and a consumer's `data-djui-set-surface`
  // anchor (the DashboardTemplate `*Props` seam) must resolve to the anchor —
  // under the old accumulating specificity, a deep chain outranked the bare
  // set-surface block and the step won.
  function nextSurfaceChain(depth: number): string {
    const link = "[data-djui-next-surface]";
    return Array.from({ length: depth }, (_, i) =>
      i < depth - 1 ? `:where(${link})` : link
    ).join(" ");
  }

  // ─── html: root surface context at level 1 ───
  sections.push(`html {\n${surfaceLevelDeclarations(1).join("\n")}\n}`);

  // Emission order (everything below is (0,1,0), so later wins on a tie):
  //   1. html-rooted step chains, depth ascending — a deeper chain matching
  //      the same element wins by order (previously by specificity).
  //   2. Set-surface re-anchored chains, depth ascending (anchor ascending
  //      within a depth) — a step below an anchor resolves from the anchor,
  //      INCLUDING under html-rooted chains deeper than the anchor-relative
  //      depth (the mid-tree reset the original scheme documented but lost
  //      to chain specificity).
  //   3. Bare set-surface anchors — a same-element anchor beats any
  //      step interpretation of that element.
  //   4. Nearest-anchor exactness, last: per-anchor `@scope` blocks whose
  //      `to ([data-djui-set-surface])` limit stops each anchor's reach at any
  //      descendant anchor. The flat scheme above cannot express
  //      nearest-anchor-wins — for a stamp below two nested disagreeing
  //      anchors, rules 2 tie on specificity and the higher-numbered anchor
  //      wins on source order regardless of which anchor is nearer. The scoped
  //      rules are the exact transcription of the runtime walk
  //      (`effectiveSurfaceLevel` in `scripts/surface.ts` — keep the two in
  //      step): nearest anchor as the base, steps counted strictly below it,
  //      lookahead- and ladder-clamped. Browsers without `@scope` ignore
  //      section 4 wholesale and keep the section 1–3 behavior, which is
  //      correct everywhere except below nested disagreeing anchors.

  // ─── 1. Root-based [data-djui-next-surface] nesting chains ───
  {
    const maxDepth = Math.min(lookahead, maxLevels - 1);
    for (let depth = 1; depth <= maxDepth; depth++) {
      const targetLevel = 1 + depth;
      const selector = `:where(html) ${nextSurfaceChain(depth)}`;
      sections.push(`${selector} {\n${surfaceLevelDeclarations(targetLevel).join("\n")}\n}`);
    }
  }

  // ─── 2. Set-surface anchored [data-djui-next-surface] nesting chains ───
  {
    const maxDepth = Math.min(lookahead, maxLevels - 1);
    for (let depth = 1; depth <= maxDepth; depth++) {
      for (let anchor = 1; anchor <= maxLevels - depth; anchor++) {
        const targetLevel = anchor + depth;
        const selector = `:where([data-djui-set-surface="${anchor}"]) ${nextSurfaceChain(depth)}`;
        sections.push(`${selector} {\n${surfaceLevelDeclarations(targetLevel).join("\n")}\n}`);
      }
    }
  }

  // ─── 3. [data-djui-set-surface="N"] for each level ───
  for (let level = 1; level <= maxLevels; level++) {
    sections.push(
      `[data-djui-set-surface="${level}"] {\n${surfaceLevelDeclarations(level).join("\n")}\n}`
    );
  }

  // ─── 4. Nearest-anchor exactness: per-anchor @scope blocks ───
  // For each anchor, the donut `@scope (anchor) to ([data-djui-set-surface])`
  // contains exactly the elements whose nearest anchor it is, so a chain rule
  // inside it can never be contested by a farther anchor's rules — the `to`
  // limit, not source order, encodes proximity. Chain links are forced below
  // the anchor by the `:where(:scope)` prefix (a stamp above the anchor never
  // counts, matching the runtime walk), and the subject's
  // `:where(:not([data-djui-set-surface]))` guard keeps a stamped element that
  // also carries an anchor on its rule-3 anchor resolution whatever a
  // browser's scoping-limit inclusivity is. Depth runs to the lookahead,
  // ladder-clamped: past the scale top a deeper chain would repeat the
  // clamped body a shallower rule already applies, so emission stops at the
  // first clamped depth (`max(1, …)` keeps the top anchor's single clamped
  // rule — without it a stamp below a top-level anchor falls through to the
  // html-rooted chains and resolves from level 1).
  for (let anchor = 1; anchor <= maxLevels; anchor++) {
    const maxDepth = Math.min(lookahead, Math.max(1, maxLevels - anchor));
    const rules: string[] = [];
    for (let depth = 1; depth <= maxDepth; depth++) {
      const targetLevel = Math.min(anchor + depth, maxLevels);
      const subjectGuard = ":where(:not([data-djui-set-surface]))";
      const chain = nextSurfaceChain(depth);
      const declarations = surfaceLevelDeclarations(targetLevel)
        .map((line) => `  ${line}`)
        .join("\n");
      rules.push(`  :where(:scope) ${chain}${subjectGuard} {\n${declarations}\n  }`);
    }
    sections.push(
      `@scope ([data-djui-set-surface="${anchor}"]) to ([data-djui-set-surface]) {\n${rules.join("\n\n")}\n}`
    );
  }

  return sections.join("\n\n") + "\n";
}

function getVariationNames(variations?: DjuiColorVariations): string[] {
  if (!variations) return [];
  const names: string[] = [];
  for (let i = 1; i <= (variations.light ?? 0); i++) {
    names.push(lightName(i));
  }
  for (let i = 1; i <= (variations.dark ?? 0); i++) {
    names.push(darkName(i));
  }
  return names;
}

// ─── Public generators ───

export function generateCSS(config: DjuiConfig): string {
  const { colors } = config;
  const sections: string[] = [];

  // ─── :root ───
  // The shared-across-modes baseline. Emits whichever color domains the config
  // declares at root — accent/context (optional; a mode-divergent theme omits
  // them here and supplies them per-mode) plus surface/foreground/form for a
  // single-mode config. The `html[data-djui-mode]` blocks below layer over this
  // by specificity ((0,1,1) > :root's (0,1,0)), so a per-mode domain overrides
  // its root baseline while domains a mode omits fall through to root.
  const interaction = resolveInteraction(config.interaction);
  const rootDirection = inferRootDirection(config);
  const rootVars: Record<string, string> = {
    ...(colors.accent ? generateAccentColors(colors.accent, rootDirection, interaction) : {}),
    ...(colors.context ? generateContextColors(colors.context, rootDirection, interaction) : {}),
    ...(colors.surface ? generateSurfaceLevels(colors.surface, rootDirection, interaction) : {}),
    ...(colors.backdrop ? generateBackdropColor(colors.backdrop) : {}),
    ...(colors.foreground ? generateForegroundColors(colors.foreground) : {}),
  };

  // Component/group default tokens — the runtime cascade. Only the tiers the
  // config declares are emitted; a component's `var()` fallback chain (authored
  // in its SCSS) references `--djui-component-<name>--size` then the family's
  // `--djui-component-group-<group>--size` then a hard floor. Emission is
  // generic and mechanical: every scalar key on a component/group entry emits
  // `--djui-component[-group]-<kebab name>--<kebab key>` (the double dash marks
  // the name↔prop boundary). Scoped colors (focus ring, input background) come
  // from `colors` instead — see `scopedColorLines`.
  const sizeTokens: string[] = [];
  const breakpoints = config.breakpoints ?? baseConfig.breakpoints ?? {};
  const responsiveSections: string[] = [];
  for (const [group, defaults] of Object.entries(config.componentGroups ?? {})) {
    sizeTokens.push(
      ...componentDefaultLines(`component-group-${kebabCase(group)}`, defaults, breakpoints, responsiveSections, configSurfaceLevelCount(config)),
    );
  }
  for (const [name, defaults] of Object.entries(config.components ?? {})) {
    sizeTokens.push(
      ...componentDefaultLines(`component-${kebabCase(name)}`, defaults, breakpoints, responsiveSections, configSurfaceLevelCount(config)),
    );
  }
  // The theme-wide separator default (per-component tokens above override it
  // through the `djui-separator-width()` chain).
  const separator = config.separator ?? config.hairline; // `hairline`: pre-rename key, one release
  if (separator !== undefined) {
    sizeTokens.push(...separatorTokenLines("--djui-separator", separator));
  }
  // The theme-wide separator ink (a surface token reference; per-component
  // tokens above override it through the `djui-separator-color()` chain).
  const separatorColor = config.separatorColor ?? config.hairlineColor;
  if (separatorColor !== undefined) {
    if (isRelativeSurface(separatorColor)) {
      sizeTokens.push(...levelAliasLines("--djui-separator-color", separatorColor, configSurfaceLevelCount(config), false));
    } else {
      sizeTokens.push(`--djui-separator-color-rgb: var(--djui-${separatorColor}-rgb);`);
    }
  }
  // The theme-wide surface radius/padding defaults — responsive-capable, so
  // each may add per-breakpoint media sections after the `:root` block.
  if (config.surfaceRadius !== undefined) {
    const emission = responsiveTokenEmission("--djui-surface-radius", config.surfaceRadius, breakpoints);
    sizeTokens.push(...emission.rootLines);
    responsiveSections.push(...emission.mediaSections);
  }
  if (config.surfacePadding !== undefined) {
    const emission = responsiveTokenEmission("--djui-surface-padding", config.surfacePadding, breakpoints);
    sizeTokens.push(...emission.rootLines);
    responsiveSections.push(...emission.mediaSections);
  }

  const font = resolveFont(config.font);
  const alpha = config.alpha ?? {};
  const rootExtra = [
    ...font.tokens,
    ...sizeTokens,
    ...defaultAccentTokens(config.accentDefault ?? "accent-primary"),
    ...shadowTokenLines(config.shadows ?? {}, "root"),
    ...typographyTokenLines(config.typography ?? {}),
    `--djui-alpha-unit: ${alpha.unit ?? 0.0625};`,
    // The pre-2026-08-29 decimals, emitted one more release for any consumer
    // that read them; the kit's own mixins are on the unit and the step chains.
    `--djui-alpha-soft: ${alpha.soft ?? 0.08};`,
    `--djui-alpha-soft-hover: ${alpha.softHover ?? 0.12};`,
    `--djui-alpha-soft-active: ${alpha.softActive ?? 0.16};`,
    `--djui-alpha-tint: ${alpha.tint ?? 0.12};`,
    `--djui-alpha-tint-hover: ${alpha.tintHover ?? 0.18};`,
    `--djui-alpha-tint-active: ${alpha.tintActive ?? 0.24};`,
    `--djui-alpha-idle: ${alpha.idle ?? 0.65};`,
    ...layerTokenLines(config.layers ?? baseConfig.layers ?? {}),
    ...scopedColorLines(config, "root"),
  ];
  // Root-level antialiasing is opt-in (default false). Dark-leaning
  // single-mode themes set this to true.
  if (colors.antialiasing === true) {
    rootExtra.push(
      "-webkit-font-smoothing: antialiased;",
      "-moz-osx-font-smoothing: grayscale;",
    );
  }
  sections.push(cssBlock(":root", rootVars, rootExtra));
  sections.push(...responsiveSections);

  // ─── html[data-djui-mode="light"] ───
  if (colors.light) {
    const lightVars: Record<string, string> = {
      ...generateSurfaceLevels(colors.light.surface, "darken", interaction),
      ...(colors.light.backdrop ? generateBackdropColor(colors.light.backdrop) : {}),
      ...generateForegroundColors(colors.light.foreground),
      ...(colors.light.accent ? generateAccentColors(colors.light.accent, "darken", interaction) : {}),
      ...(colors.light.context ? generateContextColors(colors.light.context, "darken", interaction) : {}),
    };
    const lightExtra = [
      ...scopedColorLines(config, "light"),
      ...shadowTokenLines(config.shadows ?? {}, "light"),
    ];
    // Light mode antialiasing is opt-in (default false).
    if (colors.light.antialiasing === true) {
      lightExtra.push(
        "-webkit-font-smoothing: antialiased;",
        "-moz-osx-font-smoothing: grayscale;",
      );
    }
    sections.push(cssBlock('html[data-djui-mode="light"]', lightVars, lightExtra));
  }

  // ─── html[data-djui-mode="dark"] ───
  if (colors.dark) {
    const darkVars: Record<string, string> = {
      ...generateSurfaceLevels(colors.dark.surface, "lighten", interaction),
      ...(colors.dark.backdrop ? generateBackdropColor(colors.dark.backdrop) : {}),
      ...generateForegroundColors(colors.dark.foreground),
      ...(colors.dark.accent ? generateAccentColors(colors.dark.accent, "lighten", interaction) : {}),
      ...(colors.dark.context ? generateContextColors(colors.dark.context, "lighten", interaction) : {}),
    };
    const darkExtra = [
      ...scopedColorLines(config, "dark"),
      ...shadowTokenLines(config.shadows ?? {}, "dark"),
    ];
    // Dark mode antialiasing is opt-out (default true).
    if (colors.dark.antialiasing !== false) {
      darkExtra.push(
        "-webkit-font-smoothing: antialiased;",
        "-moz-osx-font-smoothing: grayscale;",
      );
    }
    sections.push(cssBlock('html[data-djui-mode="dark"]', darkVars, darkExtra));
  }

  // ─── Surface system (data attribute rules) ───
  const surfaceSystem = generateSurfaceSystemCSS(config).trim();
  if (surfaceSystem) sections.push(surfaceSystem);

  // Font loading leads the sheet: `@import` first (CSS requires imports before
  // any other rule), then `@font-face` (valid anywhere, kept up top with its
  // imports). Self-hosted faces are the preferred path; the `@import` path is
  // for configs compiled on their own (a concatenated multi-sheet build can push
  // a non-leading `@import` out of position — shipped themes self-host).
  const prelude = [...font.imports, ...font.fontFaces];
  return [...prelude, ...sections].join("\n\n") + "\n";
}

export function generateConfigScss(config: DjuiConfig): string {
  return generateCSS(config);
}

/**
 * The named responsive bands as a compile-time SCSS map — media queries cannot
 * consume CSS custom properties, so this is the one config domain that emits
 * SCSS rather than runtime tokens. Emitted as its own generated partial
 * (`generated/breakpoints.scss`) rather than into `config.scss`: the config
 * partial carries CSS rules, and `styles/helpers` — `@use`d by every
 * per-component stylesheet — must be able to read the map without dragging
 * that CSS into each component compile. Read through the `djui-breakpoints`
 * seam (the breakpoints twin of `djui-config.scss`); always emitted, falling
 * back to the base bands, so the member exists for any `@use`.
 */
export function generateBreakpointsScss(config: DjuiConfig): string {
  const breakpoints = config.breakpoints ?? baseConfig.breakpoints ?? {};
  const bands = Object.entries(breakpoints)
    .map(([name, value]) => `  ${name}: ${value},`)
    .join("\n");
  return `// Generated from djui config — the responsive bands (\`breakpoints\`).\n$djui-breakpoints: (\n${bands}\n);\n`;
}

export function generateAll(config: DjuiConfig): Record<string, string> {
  return {
    "config.scss": generateConfigScss(config),
    "breakpoints.scss": generateBreakpointsScss(config),
  };
}
