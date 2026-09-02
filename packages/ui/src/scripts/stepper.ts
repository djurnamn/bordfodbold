/**
 * Stepper's value-element runtime — the spinbutton composition behind the
 * button-flanked static value. The Stepper has no editable field, so the
 * machine's keyboard handling (which lives on the input part) is re-issued
 * here as a plain keydown handler over the machine api, and the announced
 * value text resolves through the shared `NumberInputTranslations` record.
 */

import {
  resolveNumberInputTranslations,
  type NumberInputTranslations,
  type ResolvedNumberInputTranslations,
} from './number-input';

/**
 * The Stepper's label overrides — NumberInput's record, plus the one string
 * NumberInput has no use for.
 */
export interface StepperTranslations extends NumberInputTranslations {
  /**
   * The spinbutton's accessible name (English default: "Value").
   *
   * NumberInput does not need this: its field is a real `<input>` named by the
   * `Field` label beside it. The Stepper's value is a `<span role="spinbutton">`
   * with nothing to name it, so without this it is announced as an unnamed
   * spinbutton. The default only keeps that case from being silent —
   * a real form should pass the name of the thing being counted, exactly as
   * `Tabs`'s `listLabel` expects to be replaced.
   */
  valueLabel?: string;
}

/** The complete record: NumberInput's, plus the spinbutton's name. */
export interface ResolvedStepperTranslations extends ResolvedNumberInputTranslations {
  valueLabel: string;
}

/**
 * Resolves a `StepperTranslations` record with the English filled in — the
 * NumberInput resolver for the shared members, plus the spinbutton's name.
 */
export function resolveStepperTranslations(
  translations: StepperTranslations | undefined
): ResolvedStepperTranslations {
  return {
    ...resolveNumberInputTranslations(translations),
    valueLabel: translations?.valueLabel ?? 'Value',
  };
}

/** The slice of the number-input machine api the keydown handler drives. */
export interface StepperKeyTarget {
  increment: () => void;
  decrement: () => void;
  setToMin: () => void;
  setToMax: () => void;
}

/**
 * The spinbutton keyboard contract for the focusable value element:
 * ArrowUp/ArrowDown step, Home/End jump to the range edges — the same keys
 * the machine wires on NumberInput's field. Returns the handler the Visual's
 * keydown seam binds; unhandled keys pass through untouched. The event is
 * typed structurally (`key` + `preventDefault`) so the one handler satisfies
 * the native event and React's synthetic alike.
 */
export function createStepperKeydown(
  api: StepperKeyTarget
): (event: { key: string; preventDefault: () => void }) => void {
  return (event) => {
    switch (event.key) {
      case 'ArrowUp':
        api.increment();
        break;
      case 'ArrowDown':
        api.decrement();
        break;
      case 'Home':
        api.setToMin();
        break;
      case 'End':
        api.setToMax();
        break;
      default:
        return;
    }
    event.preventDefault();
  };
}

/**
 * The `aria-valuetext` for the value element: the record's `valueText`
 * (template or function) over the machine's formatted value, or the value
 * itself when no override is given; `undefined` while empty so the attribute
 * is omitted.
 */
export function stepperValueText(
  translations: StepperTranslations | undefined,
  value: string
): string | undefined {
  if (value === '') return undefined;
  return resolveStepperTranslations(translations).valueText?.(value) ?? value;
}

/**
 * The spinbutton's accessible name: the record's override, or the English
 * default. Always a string — an unnamed `role="spinbutton"` is a defect, so
 * there is no "omit it" branch here.
 */
export function stepperValueLabel(translations: StepperTranslations | undefined): string {
  return resolveStepperTranslations(translations).valueLabel;
}

/**
 * The machine's trigger props with `aria-controls` removed.
 *
 * The number-input machine assumes the composition NumberInput has, where the
 * ± buttons point at the `<input>` they drive. The Stepper renders no input —
 * its value is a `span[role=spinbutton]` — so the machine's `aria-controls`
 * names an element that is nowhere in the document. A reference that resolves
 * to nothing is worse than no reference: it is invalid, and assistive
 * technology cannot follow it.
 */
export function stepperTriggerProps(
  props: Record<string, unknown>
): Record<string, unknown> {
  const { 'aria-controls': _ariaControls, ...rest } = props;
  return rest;
}
