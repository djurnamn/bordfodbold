'use client';

import { useId, type ReactNode } from 'react';
import * as numberInput from '@zag-js/number-input';
import { useMachine, normalizeProps } from '@zag-js/react';
import { useLocale } from './locale';
import { resolveNumberInputTranslations, type StepperTranslations } from './scripts';

/**
 * `StepperDriver` — **pure behaviour**: the same Zag `number-input` machine
 * NumberInput runs, driving the Stepper's buttons-around-a-static-value
 * anatomy. There is no editable field, so the driver's surface drops the
 * field-only options (`name`, the typed-entry commit event); stepping is the
 * only mutation, and `onChange` fires with each stepped value. The value
 * element's spinbutton keyboard contract is composed by the `Stepper`
 * compound from this api (`createStepperKeydown` in `djui/scripts`).
 */
export type StepperApi = ReturnType<typeof numberInput.connect>;

export interface StepperDriverProps {
  /** Controlled value (`null` = empty); seed the uncontrolled control with `defaultValue`. */
  value?: number | null;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** The locale the value is formatted in; the `LocaleProvider`'s by default. */
  locale?: string;
  /** `Intl.NumberFormat` options for the value's display (grouping, decimals, a unit). */
  formatOptions?: Intl.NumberFormatOptions;
  /** Label overrides (the machine's English defaults otherwise); `valueText` takes a `{value}` template. */
  translations?: StepperTranslations;
  /** Called with the next value on every machine-driven step (`null` = emptied). */
  onChange?: (value: number | null) => void;
  /** Scoped slot: receives the live machine api; render the Visual. */
  children: (scope: { api: StepperApi }) => ReactNode;
}

/** Outbound mapping: empty → `null` (steps always parse). */
function emit(callback: ((value: number | null) => void) | undefined, details: { value: string; valueAsNumber: number }) {
  if (details.value === '') callback?.(null);
  else if (!Number.isNaN(details.valueAsNumber)) callback?.(details.valueAsNumber);
}

export function StepperDriver({
  value,
  defaultValue,
  min,
  max,
  step,
  disabled,
  locale,
  formatOptions,
  translations,
  onChange,
  children,
}: StepperDriverProps) {
  const localeContext = useLocale();
  const service = useMachine(numberInput.machine, {
    id: useId(),
    dir: localeContext.dir,
    value: value !== undefined ? (value === null ? '' : String(value)) : undefined,
    defaultValue: defaultValue !== undefined ? String(defaultValue) : undefined,
    min,
    max,
    step,
    disabled,
    locale: locale ?? localeContext.locale,
    formatOptions,
    translations: resolveNumberInputTranslations(translations),
    onValueChange: (details) => emit(onChange, details),
  });
  const api = numberInput.connect(service, normalizeProps);

  return children({ api });
}
