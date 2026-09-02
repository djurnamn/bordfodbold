/**
 * Merging a consumer's element props over a machine's.
 *
 * The kit's seam convention is that a props channel is **named for the element
 * it lands on** — `inputProps` reaches the `<input>`, `selectProps` the
 * `<select>`, `thumbProps` the slider thumb, `dropzoneProps` the drop target.
 * Where a component's root *is* that element (TextInput, NativeRadioGroup) the
 * root's own rest spread is the channel and no named seam is needed.
 *
 * For a machine-backed component the channel is already occupied: the driver
 * fills it from Zag's own getter, so a consumer had nowhere to put an
 * attribute the machine does not supply — which is exactly where the field
 * wrapper's `id` and `aria-describedby` need to go. This merges the two, the
 * consumer winning, so the channel serves both.
 *
 * Shallow on purpose. A deep merge would silently combine two `style` objects
 * or two handlers, and the cases where that is wanted (a consumer handler that
 * should run *alongside* the machine's rather than replace it) are a different
 * problem needing a different, explicit seam.
 */

/** Shallow-merges `consumerProps` over a machine record; the consumer wins. */
export function mergeElementProps(
  machineProps: Record<string, unknown>,
  consumerProps: Record<string, unknown> | undefined
): Record<string, unknown> {
  return consumerProps ? { ...machineProps, ...consumerProps } : machineProps;
}

/**
 * The `id` a consumer's element record names, when it names one - the field
 * wrapper's id, to be handed to a machine through its `ids` rather than
 * written over the element the machine looks up by its own id.
 */
export function elementIdOf(
  consumerProps: Record<string, unknown> | undefined
): string | undefined {
  const id = consumerProps?.id;
  return typeof id === 'string' && id !== '' ? id : undefined;
}
