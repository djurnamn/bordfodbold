'use client';

import { useId, type ReactNode } from 'react';
import * as zagSwitch from '@zag-js/switch';
import { useMachine, normalizeProps } from '@zag-js/react';
import { useLocale } from './locale';

/**
 * `SwitchDriver` — **pure behaviour** (the pure-driver model): the Zag
 * `switch` machine (checked state, form association via the hidden input,
 * keyboard/pointer toggling) handed to a scoped slot (`children({ api })`). No
 * markup, styles, or BEM — the appearance is `SwitchVisual` composing the shared
 * `SwitchTrackVisual`, wired by the generated `Switch` compound spreading the
 * api's getter records onto their elements.
 *
 * Naming: the value-carrying change is `onChange(checked)` (Zag's
 * `onCheckedChange` mapped); the invalid flag is the library-wide `error`
 * boolean (Zag's `invalid`).
 */
export type SwitchApi = ReturnType<typeof zagSwitch.connect>;

export interface SwitchDriverProps {
  /** Controlled checked state; seed the uncontrolled machine with `defaultChecked`. */
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  /** Marks the control invalid (Zag `invalid`; the library-wide `error` boolean). */
  error?: boolean;
  required?: boolean;
  readOnly?: boolean;
  /** Form-association: the hidden input's name/value/form. */
  name?: string;
  value?: string | number;
  form?: string;
  /** Called with the next checked state on every machine-driven toggle. */
  onChange?: (checked: boolean) => void;
  /**
   * Scoped slot: receives the live switch api; render the Visual(s). Called with
   * a `{ api }` scope object to match the engine's scoped-slot consumer emission
   * (`{({ api }) => …}`), so the generated `Switch` compound composes this
   * driver directly.
   */
  children: (scope: { api: SwitchApi }) => ReactNode;
}

export function SwitchDriver({
  checked,
  defaultChecked,
  disabled,
  error,
  required,
  readOnly,
  name,
  value,
  form,
  onChange,
  children,
}: SwitchDriverProps) {
  const localeContext = useLocale();
  const service = useMachine(zagSwitch.machine, {
    id: useId(),
    dir: localeContext.dir,
    checked,
    defaultChecked,
    disabled,
    invalid: error,
    required,
    readOnly,
    name,
    value,
    form,
    onCheckedChange: (details) => onChange?.(details.checked),
  });
  const api = zagSwitch.connect(service, normalizeProps);

  return children({ api });
}
