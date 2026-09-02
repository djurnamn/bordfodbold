'use client';

import { useId, type ReactNode } from 'react';
import * as numberInput from '@zag-js/number-input';
import { useMachine, normalizeProps } from '@zag-js/react';
import { useLocale } from './locale';
import { resolveNumberInputTranslations, type NumberInputTranslations } from './scripts';

/**
 * `NumberInputDriver` — **pure behaviour** (the pure-driver model): the
 * Zag `number-input` machine (typed entry, min/max clamping, stepping,
 * press-and-hold spinning) handed to a scoped slot (`children({ api })`).
 * No markup, styles, or BEM — the appearance is `NumberInputVisual`, wired
 * by the generated `NumberInput` compound.
 *
 * The kit surface is a `number | null` value (`null` = the empty control) over
 * the machine's string-typed value. Inbound, `null` maps to the empty string;
 * outbound, `onChange` fires with the parsed number, or `null` when the input
 * empties. A keystroke that is not yet a number (a lone `-`, a trailing `.`)
 * fires nothing — the machine keeps the partial text, and the parsed value
 * arrives once it resolves (at the latest on blur, when the machine clamps).
 * Naming: `value`/`defaultValue`/`onChange(value)`, plus `onChangeEnd(value)` —
 * the commit notification (blur or Enter, Zag's `onValueCommit`), the Slider
 * pairing.
 */
export type NumberInputApi = ReturnType<typeof numberInput.connect>;

export interface NumberInputDriverProps {
  /** Controlled value (`null` = empty); seed the uncontrolled control with `defaultValue`. */
  value?: number | null;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** The name posted by a surrounding form (the machine stamps it on the input). */
  name?: string;
  /** The locale the value is parsed and formatted in; the `LocaleProvider`'s by default. */
  locale?: string;
  /** `Intl.NumberFormat` options for the value's display (grouping, decimals, a unit). */
  formatOptions?: Intl.NumberFormatOptions;
  /** Label overrides (the machine's English defaults otherwise); `valueText` takes a `{value}` template. */
  translations?: NumberInputTranslations;
  /** The input's id - a field wrapper's, handed to the machine so its own lookups keep working. */
  inputId?: string;
  /** Called with the next parsed value on every machine-driven change (`null` = emptied). */
  onChange?: (value: number | null) => void;
  /** Called with the settled value when the entry commits (blur or Enter). */
  onChangeEnd?: (value: number | null) => void;
  /** Scoped slot: receives the live number-input api; render the Visual. */
  children: (scope: { api: NumberInputApi }) => ReactNode;
}

/** Outbound mapping: empty → `null`, unparsed partial entry → no notification. */
function emit(callback: ((value: number | null) => void) | undefined, details: { value: string; valueAsNumber: number }) {
  if (details.value === '') callback?.(null);
  else if (!Number.isNaN(details.valueAsNumber)) callback?.(details.valueAsNumber);
}

export function NumberInputDriver({
  value,
  defaultValue,
  min,
  max,
  step,
  disabled,
  name,
  locale,
  formatOptions,
  translations,
  inputId,
  onChange,
  onChangeEnd,
  children,
}: NumberInputDriverProps) {
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
    name,
    locale: locale ?? localeContext.locale,
    formatOptions,
    ids: inputId === undefined ? undefined : { input: inputId },
    translations: resolveNumberInputTranslations(translations),
    onValueChange: (details) => emit(onChange, details),
    onValueCommit: (details) => emit(onChangeEnd, details),
  });
  const api = numberInput.connect(service, normalizeProps);

  return children({ api });
}
