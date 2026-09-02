/**
 * djui's responsive-prop primitive — the runtime half of the responsive layout
 * components. A responsive prop is either a scalar (no responsive behaviour) or
 * an array of `{ value, from?, to? }` bands; `expandResponsive` turns it into the
 * inline custom-property set the component's stylesheet cascade reads.
 *
 * Shipped from `djui/scripts` and imported by the generated layout components
 * (Stack, LayoutContainer, LayoutItem) — the runtime sibling of `djui/styles`.
 * Framework-agnostic: returns a plain `Record<string, string | number>` that
 * React (`style={{...}}`), Vue (`:style`), and Svelte (`serializeStyleObject`)
 * each accept.
 */

/**
 * djui's named breakpoints. Common-first responsive — the band system uses
 * upper-bound naming. The "small" band covers the range that ends at the
 * `small` threshold; the "xlarge" band is unbounded on the high side.
 *
 * Mirrors the `width-from()` / `width-to()` / `width()` SCSS functions in
 * `styles/helpers.scss`.
 */
export type BreakpointName = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';

const BREAKPOINT_ORDER: BreakpointName[] = [
  'xsmall',
  'small',
  'medium',
  'large',
  'xlarge',
];

/**
 * One entry in a responsive prop value.
 *
 * - `from` only → `width-from(from)` (`min-width: from + 1px`)
 * - `to` only → `width-to(to)` (`max-width: to`)
 * - both → `width(from, to)` (intersection)
 * - neither → the common (always-applies) value
 *
 * Source order matters for overlap: later entries overwrite earlier ones in the
 * bands they share — same mental model as plain CSS source order.
 */
export interface ResponsiveBand<T> {
  value: T;
  from?: BreakpointName;
  to?: BreakpointName;
}

/**
 * A prop value that's either a single scalar (no responsive behaviour) or an
 * array of `ResponsiveBand` entries.
 */
export type Responsive<T> = T | ReadonlyArray<ResponsiveBand<T>>;

/**
 * Map a `width-from(from) AND width-to(to)` range into the set of djui band
 * names it covers. The bands are upper-bound-named (the SCSS cascade in the
 * layout components uses the same convention).
 */
function bandsForRange(
  from?: BreakpointName,
  to?: BreakpointName
): BreakpointName[] {
  let startIdx: number;
  if (from === undefined) {
    startIdx = 0;
  } else {
    startIdx = BREAKPOINT_ORDER.indexOf(from) + 1;
    if (startIdx >= BREAKPOINT_ORDER.length) {
      // from === "xlarge" → width-from(xlarge) is the xlarge band itself.
      startIdx = BREAKPOINT_ORDER.length - 1;
    }
  }
  const endIdx =
    to === undefined
      ? BREAKPOINT_ORDER.length - 1
      : BREAKPOINT_ORDER.indexOf(to);
  if (endIdx < startIdx) return [];
  return BREAKPOINT_ORDER.slice(startIdx, endIdx + 1);
}

/**
 * Expand a `Responsive<T>` into a set of inline CSS variables:
 * - the common value goes to `commonVar`
 * - each band entry's value goes to `${bandVarPrefix}-<band>`
 *
 * Always emits the common var (defaulting to `fallback` if no common entry is
 * present). This is required: custom-property inheritance means a nested
 * instance with no value of its own would otherwise pick up its ancestor's
 * value through the SCSS fallback chain.
 */
export function expandResponsive<T extends number | string>(
  value: Responsive<T> | undefined,
  commonVar: string,
  bandVarPrefix: string,
  fallback: T,
  transform?: (v: T) => string | number
): Record<string, string | number> {
  const xform = (v: T): string | number =>
    transform ? transform(v) : (v as string | number);
  const out: Record<string, string | number> = {};

  if (value === undefined) {
    out[commonVar] = xform(fallback);
    return out;
  }

  if (!Array.isArray(value)) {
    out[commonVar] = xform(value as T);
    return out;
  }

  // Common value: last no-from/no-to entry wins (source order).
  let commonValue: T = fallback;
  for (const entry of value as ReadonlyArray<ResponsiveBand<T>>) {
    if (entry.from === undefined && entry.to === undefined) {
      commonValue = entry.value;
    }
  }
  out[commonVar] = xform(commonValue);

  // Banded entries: later overwrites earlier in any band they share.
  for (const entry of value as ReadonlyArray<ResponsiveBand<T>>) {
    if (entry.from === undefined && entry.to === undefined) continue;
    const bands = bandsForRange(entry.from, entry.to);
    for (const band of bands) {
      out[`${bandVarPrefix}-${band}`] = xform(entry.value);
    }
  }

  return out;
}
