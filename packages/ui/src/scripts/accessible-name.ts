/**
 * Development-time checks for the names a control cannot supply itself.
 *
 * An icon-only button is a pit of failure: the kit advertises it as a
 * zero-config affordance — pass an `icon`, omit the `label`, get the round
 * icon-only chrome — and the result is a `<button>` whose accessible name is the
 * empty string. It typechecks, it renders, it looks right, and a screen reader
 * announces "button". Nothing in the type system can catch it, because the name
 * may legitimately arrive from `aria-label`, `aria-labelledby` or `title`, all of
 * which ride the passthrough rather than being declared props.
 *
 * So the kit says so out loud, once, while you are building.
 */

/** Warn at most once per component per session — a list of fifty icon buttons
 *  should not produce fifty identical lines on every render. */
const warned = new Set<string>();

/**
 * Production is detected rather than development, deliberately: every bundler
 * that matters defines `process.env.NODE_ENV`, and the failure mode of guessing
 * wrong in the other direction is a silent check. A consumer with no bundler at
 * all (`process` undefined) is treated as development and will see the warning —
 * which is the right way round for a warning whose whole job is to be noticed.
 */
// Declared locally rather than by pulling `@types/node` into a browser-facing
// package: this is the one global the check needs, and every bundler that matters
// substitutes it at build time.
declare const process: { env?: { NODE_ENV?: string } } | undefined;

function isProduction(): boolean {
  return typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';
}

/** The sources a name can arrive from, all of them passthrough attributes. */
function hasAccessibleName(attributes: Record<string, unknown> | undefined): boolean {
  if (!attributes) return false;
  const label = attributes['aria-label'];
  const labelledBy = attributes['aria-labelledby'];
  const title = attributes.title;
  return Boolean(
    (typeof label === 'string' && label.trim()) ||
      (typeof labelledBy === 'string' && labelledBy.trim()) ||
      (typeof title === 'string' && title.trim())
  );
}

export interface IconOnlyNameCheck {
  /** The icon content — a node, a slot, or whatever the target calls one. */
  icon?: unknown;
  /** The visible label, which would name the control if present. */
  label?: unknown;
  /** Default-slot content, which would name it too. */
  children?: unknown;
  /** The passthrough attributes, where a name would arrive from. */
  attributes?: Record<string, unknown>;
}

/**
 * Warn when a control renders icon-only with no accessible name from any source.
 *
 * Called from the generated components' script bodies, so the check sits with
 * the thing it is checking rather than in a driver that does not exist — `Button`
 * and `ToolbarButton` are appearance-only and have no hand-written runtime.
 *
 * Silent in production, silent when the control has a visible label or default
 * content, and silent when any naming attribute is present.
 */
export function warnUnnamedIconButton(component: string, check: IconOnlyNameCheck): void {
  if (isProduction()) return;
  if (!check.icon) return;
  if (check.label || check.children) return;
  if (hasAccessibleName(check.attributes)) return;
  if (warned.has(component)) return;
  warned.add(component);
  console.warn(
    `[djui] <${component}> rendered icon-only with no accessible name, so screen ` +
      'readers announce it as an unlabelled button. Pass `aria-label` (or ' +
      '`aria-labelledby` / `title`) naming the action — "Delete row", not the ' +
      'glyph. This warning appears once per component and is stripped in ' +
      'production builds.'
  );
}

/** Test seam: forget what has already been warned about. */
export function resetUnnamedIconButtonWarnings(): void {
  warned.clear();
}

/**
 * Resolve the accessible name on an element record a Zag machine produced.
 *
 * Several machines stamp `aria-labelledby` at their own **label** or **title**
 * part unconditionally — Select on its trigger and its listbox, Combobox on its
 * content and its list, and the same shape elsewhere. djui renders none of those
 * parts (labelling is `Field`'s job, and a popout's heading is the consumer's),
 * so the reference resolves to nothing. That is worse than the attribute being
 * absent in two distinct ways. A dangling `aria-labelledby` is the *highest*
 * priority source in the accessible-name algorithm, so it suppresses the name the
 * element would otherwise compute from its own content; and it makes an unnamed
 * control look named to anything reading the markup.
 *
 * So the reference is dropped wherever djui does not render the part it points
 * at, and an explicit `label` — the naming seam a component offers its consumer —
 * becomes `aria-label` in its place. With neither, the element falls back to
 * naming itself from its content, which for a Select trigger is the selected
 * value: not a great name, and a real one.
 *
 * Not for every record: `Menu` points its panel at its **trigger**, and `Slider`
 * at a label it does render. Both resolve, and neither goes through here.
 */
export function resolveOverlayLabelling<Record_ extends Record<string, unknown>>(
  record: Record_,
  label?: string
): Record_ {
  const named = typeof label === 'string' && label.trim().length > 0;
  if (!named && !('aria-labelledby' in record)) return record;
  const { 'aria-labelledby': _unrendered, ...rest } = record as Record<string, unknown>;
  return (named ? { ...rest, 'aria-label': label } : rest) as unknown as Record_;
}
