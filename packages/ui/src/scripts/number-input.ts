/**
 * NumberInput's label runtime — the serializable sibling of the `number-input`
 * machine's translation record, shared by all three targets. The increment and
 * decrement labels are plain strings the machine takes as-is; `valueText` (the
 * input's `aria-valuetext`) is the one function seam. Functions cannot cross a
 * server→client component boundary, so the value text is also expressible as a
 * `{value}` template, and the function the machine wants is created on the
 * client side, inside the driver.
 */

import { fillTemplate } from './fill-template';

/**
 * The drivers' label overrides — the number-input machine's translation record
 * (its field names kept verbatim), with `valueText` widened to also accept a
 * template string, the serializable form a server-rendered page can pass
 * whole.
 *
 * Template placeholder: `{value}` (the machine's formatted value string). E.g.
 * `"{value} poäng"`.
 */
export interface NumberInputTranslations {
  /** The value announced as `aria-valuetext` — a `{value}` template or the machine's function. */
  valueText?: string | ((value: string) => string);
  /** The increment control's label (English default: "Increase value"). */
  incrementLabel?: string;
  /** The decrement control's label (English default: "Decrease value"). */
  decrementLabel?: string;
}

/**
 * The record the machine takes: both control labels present, and the value
 * text as the function form when one was given. `valueText` stays optional —
 * absent, the machine announces the value itself, which is the right default
 * for a plain number.
 */
export interface ResolvedNumberInputTranslations {
  valueText?: (value: string) => string;
  incrementLabel: string;
  decrementLabel: string;
}

/**
 * Resolves a `NumberInputTranslations` record into the complete shape the
 * machine takes: a function `valueText` passes through untouched (the function
 * form always wins), a template string becomes the filling function, and both
 * control labels are filled with the kit's English.
 */
export function resolveNumberInputTranslations(
  translations: NumberInputTranslations | undefined
): ResolvedNumberInputTranslations {
  const valueText = translations?.valueText;
  return {
    ...(typeof valueText === 'function'
      ? { valueText }
      : typeof valueText === 'string'
        ? { valueText: (value: string) => fillTemplate(valueText, { value }) }
        : {}),
    incrementLabel: translations?.incrementLabel ?? 'Increase value',
    decrementLabel: translations?.decrementLabel ?? 'Decrease value',
  };
}
