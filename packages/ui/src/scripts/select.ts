/**
 * Select's trigger-props merge — the escape hatch's one piece of logic, shared
 * by all three targets.
 *
 * The custom `Select` renders a `<button>` whose only accessible name is the
 * selected value, so an instance with no visible label (one per table row, one
 * in a compact toolbar) names itself through `triggerProps`. The merge is
 * shallow with the consumer winning.
 *
 * The naming rule it used to carry has moved to `resolveOverlayLabelling`, and
 * got stricter on the way: the machine's `aria-labelledby` points at a label
 * part djui does not render, so it is dropped whether or not a consumer supplies
 * a name. It used to survive an unlabelled trigger, where it did real damage — a
 * dangling reference is the highest-priority name source, so it suppressed the
 * name the button computes from its own content and left the control nameless
 * while looking labelled.
 */
import { resolveOverlayLabelling } from './accessible-name';

/** The id of the span the trigger shows the selected value (or placeholder) in.
 *  Derived from the trigger's own id so it is stable across a server and a client
 *  render without a second id generator, and unique whether the trigger id is the
 *  machine's or a consumer's. Shared: the Visual stamps it, the naming rule below
 *  points at it. */
export function selectValueId(triggerId: string): string {
  return `${triggerId}-value`;
}

/**
 * Shallow-merges `consumerProps` over the machine's trigger record, clears the
 * machine's unrendered label reference, and resolves the trigger's accessible
 * name.
 *
 * The name is the part with a rule rather than a merge. `role="combobox"` does
 * not take its name from its content, so the visible text in the trigger — the
 * selected option, or the placeholder — names nothing on its own. Pointing
 * `aria-labelledby` at that text is what makes the control say what a sighted
 * user can already see, and it composes: a `Field` hands its label's id in
 * through `consumerProps`, and the two references together read "Tier Apple",
 * the field and its current value in one announcement.
 *
 * An explicit `aria-label` is left to win outright, with no value reference
 * added beside it. `aria-labelledby` outranks `aria-label` in the accessible-name
 * algorithm, so appending one would silently take the name away from a consumer
 * who asked for it by name — the seam this function exists to serve.
 */
export function mergeTriggerProps(
  machineProps: Record<string, unknown>,
  consumerProps: Record<string, unknown> | undefined,
  valueId?: string
): Record<string, unknown> {
  const merged: Record<string, unknown> = {
    ...resolveOverlayLabelling(machineProps),
    ...consumerProps,
  };
  if (valueId === undefined) return merged;
  // The consumer named it outright: theirs, untouched.
  if (typeof merged['aria-label'] === 'string' && merged['aria-labelledby'] === undefined) {
    return merged;
  }
  const labelledBy = merged['aria-labelledby'];
  merged['aria-labelledby'] =
    typeof labelledBy === 'string' && labelledBy.trim() ? `${labelledBy} ${valueId}` : valueId;
  return merged;
}
