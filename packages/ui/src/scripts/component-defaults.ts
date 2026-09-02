/**
 * The component-defaults bootstrap — the runtime half of a component's
 * configurable appearance. A component's *sizes and colors* come from the
 * config as CSS custom properties (build-time); a handful of appearance
 * *treatments* are class-driven, not token-driven (the Field floating label,
 * the Tabs folder theme, a Button's fill variant), so they can't ride a CSS
 * variable. Those live here instead: a theme states them under
 * `components.<Name>.props`, the consumer hands that config to
 * `configureComponentDefaults` once (on the server before render, and on the
 * client), and each generated component reads the default through
 * `componentDefault` when its own prop is left unset.
 *
 * The sibling of the mode bootstrap: mode answers "what sets
 * `data-djui-mode`", this answers "what a component renders when a treatment
 * prop is omitted". Both are the standing runtime answer to a question every
 * consumer would otherwise hand-roll.
 *
 * Resolution is explicit-prop-wins: a component resolves `prop ??
 * componentDefault('Name', 'prop')`, so an instance value always beats the
 * configured default, and an explicit opt-out value (`'plain'`, `'none'`)
 * beats it too — opting out is a value, not the absence of one.
 *
 * SSR: the store is module-level state, so `configureComponentDefaults` must
 * run on the server before the first render (and again on the client) for the
 * defaults to be in scope both places. It carries no `window`/`document`
 * reference, so a server call is safe.
 */
import type { DjuiConfig, DjuiComponentDefaults, DjuiComponentGroupDefaults } from '../config/types';

/** The `components` slice of a config — component name → its defaults. */
type ComponentsSlice = Record<string, DjuiComponentDefaults>;

/** What `configureComponentDefaults` accepts: a whole `DjuiConfig`, or just its
 *  `components` slice (the same object under `config.components`). */
export type ComponentDefaultsSource = DjuiConfig | ComponentsSlice | undefined;

/**
 * A stored default value: a string (the class-driven treatment case — a
 * `variant`, a `theme`), a boolean (a flag treatment — `rounded`) or an
 * attribute record (the props-seam case — a table's `headerCellProps`, spread
 * onto every cell). One resolver per shape: `componentDefault` returns only the
 * string form, `componentDefaultFlag` only the boolean form,
 * `componentDefaultRecord` only the record form.
 */
type ComponentDefaultValue = string | boolean | Record<string, unknown>;

/** name → (prop → default value). Module-level, replaced wholesale on each
 *  `configureComponentDefaults` call. A component-group's runtime defaults are
 *  stored here too, under the group's scope key (`component-group-<name>`), so a
 *  family default reads through the same `componentDefault` resolver. */
let store: Record<string, Record<string, ComponentDefaultValue>> = {};

/** Kebab-case a group name so its runtime scope key matches the CSS scope the
 *  generator emits (`component-group-<name>`). Mirrors the generator's helper. */
function kebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** Pick the `components` slice out of whatever was passed. A `DjuiConfig` carries
 *  it under `components`; a bare slice is used as-is. */
function componentsOf(source: ComponentDefaultsSource): ComponentsSlice {
  if (source && typeof source === 'object' && 'components' in source) {
    return (source as DjuiConfig).components ?? {};
  }
  return (source as ComponentsSlice) ?? {};
}

/** Pick the `componentGroups` slice out of a whole config. A bare `components`
 *  slice carries none, so groups' runtime defaults only load from a full config. */
function componentGroupsOf(
  source: ComponentDefaultsSource
): Record<string, DjuiComponentGroupDefaults> {
  if (source && typeof source === 'object' && 'componentGroups' in source) {
    return (source as DjuiConfig).componentGroups ?? {};
  }
  return {};
}

/**
 * Store the per-component prop defaults from a config (or its `components`
 * slice). Replaces any previous configuration — call it once at startup with
 * the active theme's config. Only the `props` sub-object of each component
 * entry is read; sizes, colors, and the rest are the build-time CSS half and
 * are ignored here. Passing an empty object (or nothing) clears the store.
 */
export function configureComponentDefaults(source: ComponentDefaultsSource): void {
  const components = componentsOf(source);
  const next: Record<string, Record<string, ComponentDefaultValue>> = {};
  for (const [name, entry] of Object.entries(components)) {
    const props = entry?.props;
    if (props && typeof props === 'object') {
      next[name] = { ...props };
    }
  }
  // Component-group runtime prop defaults — the group tier's peer of a
  // component's `props`. Stored under the group's scope key
  // (`component-group-<name>`, matching the CSS scope), so a member reads its
  // family default with `componentDefault('component-group-<name>', '<prop>')`.
  // Only present when a whole config is passed; a bare `components` slice has none.
  for (const [group, defaults] of Object.entries(componentGroupsOf(source))) {
    const props = defaults?.props;
    if (props && typeof props === 'object') {
      next[`component-group-${kebabCase(group)}`] = { ...props };
    }
  }
  store = next;
}

/**
 * The configured default for one component prop, or `undefined` when none is
 * set (nothing configured, or that prop left out). A component resolves
 * `prop ?? componentDefault('Name', 'prop')` so an explicit prop — including an
 * opt-out value — always wins.
 */
export function componentDefault(componentName: string, propName: string): string | undefined {
  const value = store[componentName]?.[propName];
  // Only the string form answers here — a flag is read through
  // `componentDefaultFlag`, a record-valued default (a props seam) through
  // `componentDefaultRecord`. This keeps the resolver's return type exactly
  // `string | undefined`, so the generated class conditions that compare it
  // against string literals stay sound.
  return typeof value === 'string' ? value : undefined;
}

/**
 * The configured default for one component prop when that default is a
 * **boolean** — a flag treatment (`rounded`), or `undefined` when none is set.
 * The boolean twin of `componentDefault`: a Visual resolves
 * `flag ?? componentDefaultFlag('Name', 'flag')`, so an explicit `false` — the
 * opt-out — beats a configured `true` the way `'plain'` beats a configured fill.
 */
export function componentDefaultFlag(componentName: string, propName: string): boolean | undefined {
  const value = store[componentName]?.[propName];
  return typeof value === 'boolean' ? value : undefined;
}

/**
 * The configured default for one component prop when that default is an
 * **attribute record** — a props seam (a table's `headerCellProps`), or
 * `undefined` when none is set. The record twin of `componentDefault`: a Visual
 * spreads `{ ...componentDefaultRecord('Name', 'prop'), ...prop }` so an
 * instance record shallow-merges over the configured one (instance keys win).
 */
export function componentDefaultRecord(
  componentName: string,
  propName: string
): Record<string, unknown> | undefined {
  const value = store[componentName]?.[propName];
  return value && typeof value === 'object' ? value : undefined;
}
