/**
 * The djui color-token vocabulary — the value every colored component's
 * `color` prop accepts. Tokens are namespaced by the palette domain that
 * emits their `--djui-<token>-*-rgb` channel set:
 *
 * - `accent-<name>` — the theme's accents (`accent-primary`, …), plus the
 *   semantic `accent-default`;
 * - `context-<name>` — the intent colors (`context-negative`,
 *   `context-warning`, `context-positive`, `context-info`, `context-neutral`
 *   in the shipped themes);
 * - `foreground-<name>` — the foreground pair (`foreground-primary`);
 * - `surface-<n>` — the surface scale's levels (`surface-1`, …);
 * - `backdrop` — the page background.
 *
 * The union is open within each namespace (accent and context names are
 * theme-defined), but it rejects an un-namespaced name — passing a bare
 * `"negative"` would leave the component's color channels unset and the
 * component silently unstyled, which is exactly the mistake the namespacing
 * catches. The components' generated prop declarations inline this union
 * structurally (they ship import-free); this named form is for consumer code
 * that passes tokens around.
 */
export type DjuiColorToken =
  | `accent-${string}`
  | `context-${string}`
  | `foreground-${string}`
  | `surface-${string}`
  | 'backdrop';
