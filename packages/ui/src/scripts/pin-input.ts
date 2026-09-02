/**
 * PinInput's runtime — the serializable sibling of the `pin-input` machine's
 * translation record, the string ↔ character-array value mapping the three
 * drivers share, and the per-cell prop routing the compound spreads.
 */

import { fillTemplate } from './fill-template';

/**
 * The drivers' label overrides. The machine names each cell for assistive
 * technology by index; `inputLabel` is that name as a template — `{index}`
 * (1-based) and `{length}` — or the machine's function form.
 */
export interface PinInputTranslations {
  /** The per-cell accessible name (English default: "Character {index} of {length}"). */
  inputLabel?: string | ((index: number, length: number) => string);
}

export interface ResolvedPinInputTranslations {
  inputLabel: (index: number, length: number) => string;
}

export function resolvePinInputTranslations(
  translations: PinInputTranslations | undefined
): ResolvedPinInputTranslations {
  const inputLabel = translations?.inputLabel ?? 'Character {index} of {length}';
  return {
    inputLabel:
      typeof inputLabel === 'function'
        ? inputLabel
        : (index: number, length: number) =>
            fillTemplate(inputLabel, { index: index + 1, length }),
  };
}

/**
 * The kit's value is one string — what the hidden input posts — over the
 * machine's one-entry-per-cell array. Inbound: split into characters and pad
 * with empties to the cell count, so a short controlled value leaves the
 * remaining cells blank; `undefined` stays `undefined` (uncontrolled).
 */
export function pinInputValueArray(
  value: string | undefined,
  length: number
): string[] | undefined {
  if (value === undefined) return undefined;
  const characters = Array.from(value).slice(0, length);
  while (characters.length < length) characters.push('');
  return characters;
}

/** The compound's `inputProps` seam: the `id` a field wrapper hands the control. */
export function pinInputFirstCellId(
  inputProps: Record<string, unknown> | undefined
): string | undefined {
  const id = inputProps?.id;
  return typeof id === 'string' ? id : undefined;
}

/**
 * One record per cell: the machine's own input props, with the consumer's
 * `inputProps` merged over every cell — minus `id`, which names the FIRST
 * cell alone (through the machine's `ids.input`, so the machine's focus
 * hand-off keeps working) and is the target a `<label for>` focuses.
 */
export function pinInputCellProps(
  api: {
    items: number[];
    getInputProps: (props: { index: number }) => Record<string, unknown>;
  },
  inputProps: Record<string, unknown> | undefined
): Record<string, unknown>[] {
  if (!inputProps) return api.items.map((index) => api.getInputProps({ index }));
  const { id: _id, ...shared } = inputProps;
  return api.items.map((index) => ({ ...api.getInputProps({ index }), ...shared }));
}
