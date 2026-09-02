'use client';

import { useId, type ReactNode } from 'react';
import * as pinInput from '@zag-js/pin-input';
import { useMachine, normalizeProps } from '@zag-js/react';
import { useLocale } from './locale';
import {
  pinInputValueArray,
  resolvePinInputTranslations,
  type PinInputTranslations,
} from './scripts';

/**
 * `PinInputDriver` — **pure behaviour** (the pure-driver model): the Zag
 * `pin-input` machine (one character per cell, focus advancing as characters
 * land, backspace stepping back, arrow keys, paste spreading across the
 * cells, select-on-focus, the joined value posted by a hidden input) handed to
 * a scoped slot (`children({ api })`). No markup, styles, or BEM — the
 * appearance is `PinInputVisual`, wired by the generated `PinInput` compound.
 *
 * The kit surface is one **string** (`value`/`defaultValue`/`onChange(value)`)
 * over the machine's one-entry-per-cell array; `length` is the cell count.
 * `onComplete(value)` fires once every cell holds a character — the moment a
 * PIN form usually submits itself. Naming per the freeze: `error` for Zag's
 * `invalid`, `onChange` for the value, `on<Verb>` for the discrete events.
 */
export type PinInputApi = ReturnType<typeof pinInput.connect>;

export interface PinInputDriverProps {
  /** Controlled value; seed the uncontrolled control with `defaultValue`. */
  value?: string;
  defaultValue?: string;
  /** The number of cells (default 4). */
  length?: number;
  /** What a cell accepts (default `numeric`). */
  type?: 'numeric' | 'alphanumeric' | 'alphabetic';
  /** Hide the characters, as a password field does. */
  mask?: boolean;
  /** Mark the control as a one-time code, so a platform can offer one it received. */
  otp?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  /** Blur the last cell once the value is complete. */
  blurOnComplete?: boolean;
  /** Select a cell's character when it gains focus (default on), so typing replaces it. */
  selectOnFocus?: boolean;
  disabled?: boolean;
  /** Marks the control invalid (Zag `invalid`; the library-wide `error` boolean). */
  error?: boolean;
  required?: boolean;
  readOnly?: boolean;
  /** Form-association: the hidden input's name/form. */
  name?: string;
  form?: string;
  /** The first cell's id — what a field wrapper's `<label for>` focuses. */
  inputId?: string;
  /** Label overrides (the kit's English otherwise); `inputLabel` takes `{index}` / `{length}`. */
  translations?: PinInputTranslations;
  /** Called with the joined value on every machine-driven change. */
  onChange?: (value: string) => void;
  /** Called with the joined value once every cell holds a character. */
  onComplete?: (value: string) => void;
  /** Called with the rejected character and its cell when a keystroke does not match `type`. */
  onInvalid?: (character: string, index: number) => void;
  /** Scoped slot: receives the live pin-input api; render the Visual. */
  children: (scope: { api: PinInputApi }) => ReactNode;
}

export function PinInputDriver({
  value,
  defaultValue,
  length = 4,
  type,
  mask,
  otp,
  placeholder,
  autoFocus,
  blurOnComplete,
  selectOnFocus,
  disabled,
  error,
  required,
  readOnly,
  name,
  form,
  inputId,
  translations,
  onChange,
  onComplete,
  onInvalid,
  children,
}: PinInputDriverProps) {
  const localeContext = useLocale();
  const service = useMachine(pinInput.machine, {
    id: useId(),
    dir: localeContext.dir,
    count: length,
    value: pinInputValueArray(value, length),
    defaultValue: pinInputValueArray(defaultValue, length),
    type,
    mask,
    otp,
    placeholder,
    autoFocus,
    blurOnComplete,
    selectOnFocus,
    disabled,
    invalid: error,
    required,
    readOnly,
    name,
    form,
    ids: inputId === undefined ? undefined : { input: (index) => (index === '0' ? inputId : undefined) as string },
    translations: resolvePinInputTranslations(translations),
    onValueChange: (details) => onChange?.(details.valueAsString),
    onValueComplete: (details) => onComplete?.(details.valueAsString),
    onValueInvalid: (details) => onInvalid?.(details.value, details.index),
  });
  const api = pinInput.connect(service, normalizeProps);

  return children({ api });
}
