export type { DjuiConfig, DjuiColorsConfig, DjuiColorDefinition, DjuiColorVariations, DjuiModeColorConfig, DjuiScopedColors, DjuiScopedColorOverrides, DjuiComponentDefaults, DjuiComponentGroupDefaults, DjuiSeparatorValue, DjuiResponsiveValue, DjuiShadowColorValue, DjuiShadowDefinition, DjuiTypographyVariant, DjuiEasing, DjuiSurfaceColorConfig, DjuiSurfaceRampConfig, DjuiSurfaceLevelsConfig, DjuiFontConfig, DjuiFontFamily, DjuiFontVariation } from "./types";
export { defaultConfig } from "./default";
export { baseConfig } from "./base";
export type { DjuiBaseConfig } from "./base";
export {
  generateCSS,
  generateConfigScss,
  generateBreakpointsScss,
  generateAll,
  deriveColorTokens,
} from "./generator";

import type {
  DjuiConfig,
  DjuiColorsConfig,
  DjuiModeColorConfig,
  DjuiComponentDefaults,
  DjuiComponentGroupDefaults,
} from "./types";

/**
 * A recursively-optional view of a type — the shape of consumer `overrides`,
 * where any leaf (a single accent, one mode's surface, a component size) may be
 * supplied alone. Records bottom out at their value type so a color definition
 * is overridden whole, not field-by-field.
 */
export type DeepPartial<T> = T extends unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/**
 * Extend a theme with consumer overrides — the consumer-facing primitive.
 *
 * `defineConfig(theme, overrides)` returns a complete config: the chosen theme
 * is the base, and `overrides` are merged on top. Pass a shipped theme
 * (`import { reaperTheme } from "djui/themes/reaper"`) or your own. To author a
 * theme from scratch, build a `DjuiConfig` literal over `baseConfig` instead of
 * calling this.
 *
 * The merge is structured, not a blind deep-merge:
 * - **accent / context** (root and per-mode) merge by key — overriding
 *   `accent.primary` keeps the theme's other accents.
 * - **surface / backdrop / foreground** replace wholesale (a scale, a backdrop,
 *   or a foreground pair is a unit).
 * - **light / dark** merge field-by-field over the theme's same-mode block.
 * - **typography, components, componentGroups** merge by key (a group's `colors`
 *   sub-object replaces wholesale).
 * - **accentDefault, fontFamily, alpha, shadows** are overridden (alpha/shadows by key).
 * - **breakpoints / layers** merge by name; **separator / surfaceRadius /
 *   surfacePadding** replace wholesale (a per-axis pair or per-breakpoint map
 *   is a unit).
 */
export function defineConfig(
  theme: DjuiConfig,
  overrides: DeepPartial<DjuiConfig> = {},
): DjuiConfig {
  const base = theme.colors;
  // Overrides are deep-partial at the type level; the structured merge below
  // treats each domain explicitly, so a loose internal view keeps the merge
  // readable without leaking `DeepPartial` into every spread.
  const over = (overrides.colors ?? {}) as Partial<DjuiColorsConfig>;

  const mergeDomain = (
    b: DjuiColorsConfig["accent"],
    o: DjuiColorsConfig["accent"],
  ): DjuiColorsConfig["accent"] => (o ? { ...b, ...o } : b);

  // A per-mode block merges field-by-field over the theme's same-mode block;
  // either side may be absent.
  const mergeMode = (
    b: DjuiModeColorConfig | undefined,
    o: DjuiModeColorConfig | undefined,
  ): DjuiModeColorConfig | undefined => {
    if (!b) return o;
    if (!o) return b;
    return {
      // Wholesale, like the root surface: a scale is a unit, and the ramp and
      // explicit forms must never blend into one config.
      surface: o.surface ?? b.surface,
      backdrop: o.backdrop ?? b.backdrop,
      foreground: { ...b.foreground, ...o.foreground },
      accent: mergeDomain(b.accent, o.accent),
      context: mergeDomain(b.context, o.context),
      antialiasing: o.antialiasing ?? b.antialiasing,
    };
  };

  const colors: DjuiColorsConfig = {
    accent: mergeDomain(base.accent, over.accent),
    context: mergeDomain(base.context, over.context),
  };
  const surface = over.surface ?? base.surface;
  if (surface) colors.surface = surface;
  const backdrop = over.backdrop ?? base.backdrop;
  if (backdrop) colors.backdrop = backdrop;
  const foreground = over.foreground ?? base.foreground;
  if (foreground) colors.foreground = foreground;
  const antialiasing = over.antialiasing ?? base.antialiasing;
  if (antialiasing !== undefined) colors.antialiasing = antialiasing;
  const light = mergeMode(base.light, over.light);
  if (light) colors.light = light;
  const dark = mergeMode(base.dark, over.dark);
  if (dark) colors.dark = dark;

  // Size tiers deep-merge per key, so overriding one component (or one group
  // field) keeps the theme's other defaults. The entries are read back through
  // the concrete type (the same loose-view move as `over` above): the
  // deep-partial view puts `undefined` in every index signature, which a
  // strict consumer's spread rejects even though a merged entry never keeps an
  // undefined key a caller didn't write.
  const components = { ...theme.components };
  for (const [name, defaults] of Object.entries(overrides.components ?? {})) {
    components[name] = { ...components[name], ...(defaults as DjuiComponentDefaults) };
  }
  const componentGroups = { ...theme.componentGroups };
  for (const [group, defaults] of Object.entries(overrides.componentGroups ?? {})) {
    componentGroups[group] = {
      ...componentGroups[group],
      ...(defaults as DjuiComponentGroupDefaults),
    };
  }

  const merged: DjuiConfig = {
    colors,
    accentDefault: overrides.accentDefault ?? theme.accentDefault,
    // font is a config-or-string union, so an override replaces it whole
    // (a consumer changing the typeface supplies a complete value).
    font: (overrides.font as DjuiConfig["font"]) ?? theme.font,
    typography: { ...theme.typography, ...(overrides.typography as DjuiConfig["typography"]) },
    components,
    componentGroups,
    breakpoints: { ...theme.breakpoints, ...(overrides.breakpoints as DjuiConfig["breakpoints"]) },
    alpha: { ...theme.alpha, ...overrides.alpha },
    shadows: { ...theme.shadows, ...(overrides.shadows as DjuiConfig["shadows"]) },
  };
  // separator / surfaceRadius / surfacePadding replace wholesale (a per-axis
  // pair or per-breakpoint map is a unit); omitted when neither side declares
  // them, so unconfigured output stays token-free.
  // `hairline` / `hairlineColor` are the pre-rename keys, accepted one release
  // and normalised to the new names here so nothing downstream sees them.
  const separator =
    (overrides.separator as DjuiConfig["separator"]) ??
    (overrides.hairline as DjuiConfig["separator"]) ??
    theme.separator ??
    theme.hairline;
  if (separator !== undefined) merged.separator = separator;
  const separatorColor =
    (overrides.separatorColor as DjuiConfig["separatorColor"]) ??
    (overrides.hairlineColor as DjuiConfig["separatorColor"]) ??
    theme.separatorColor ??
    theme.hairlineColor;
  if (separatorColor !== undefined) merged.separatorColor = separatorColor;
  delete merged.hairline;
  delete merged.hairlineColor;
  const surfaceRadius = (overrides.surfaceRadius as DjuiConfig["surfaceRadius"]) ?? theme.surfaceRadius;
  if (surfaceRadius !== undefined) merged.surfaceRadius = surfaceRadius;
  const surfacePadding = (overrides.surfacePadding as DjuiConfig["surfacePadding"]) ?? theme.surfacePadding;
  if (surfacePadding !== undefined) merged.surfacePadding = surfacePadding;
  // layers merge by rung name; omitted when neither side declares them, so the
  // generator's `baseConfig.layers` fallback still applies. (Previously the
  // merge dropped a theme's ladder entirely — a retuned ladder silently
  // reverted to the base one.)
  if (theme.layers !== undefined || overrides.layers !== undefined) {
    merged.layers = { ...theme.layers, ...(overrides.layers as DjuiConfig["layers"]) };
  }
  return merged;
}
