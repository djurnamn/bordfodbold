'use client';

import { useId, type ReactNode } from 'react';
import {
  fieldDescribedBy,
  fieldElementIds,
  type FieldTranslations,
} from './scripts';
import { FieldVisual } from './FieldVisual';

/**
 * `Field` (React) — the form-field wrapper **behaviour**: the irreducible runtime
 * a template can't express, composing the generated `FieldVisual` for all
 * appearance (the Visual/driver split). It owns only the
 * `useId` fallback and the **render-function children** — the render-function
 * coupling: `children` may be a function
 * receiving `{ id, className }` to wire the field's generated id and input class
 * into an arbitrary control.
 *
 *   <Field label="Email" errorMessage="Required">
 *     {({ id, className }) => <input id={id} className={className} />}
 *   </Field>
 *
 * Plain children are projected into the field's `__inner` unchanged (for a
 * control that needs no id wiring). The resolved id is handed to `FieldVisual`
 * as `htmlFor` so the `<label>` points at the control — dropped for the inert
 * `nonInteractive` twin (the label renders as a `<span>`).
 */
export interface FieldRenderProps {
  /** The field's id — set on the control so the `<label for>` associates. */
  id: string;
  /** The field-scoped input class to spread onto the control. */
  className: string;
  /**
   * The control's `aria-describedby`: the ids of whichever descriptive parts
   * this field renders — the explanatory text, the validation message, or both,
   * in that reading order. Absent when the field renders neither.
   */
  describedBy?: string;
  /**
   * The label element's id, for a control the platform will not associate by
   * `for` — a `<fieldset>` names itself with `aria-labelledby` pointing here.
   */
  labelledBy?: string;
  /**
   * The control's `aria-invalid`, present only when the field is in error. It
   * is what tells assistive technology the CONTROL's state changed, as opposed
   * to some text having appeared near it — which is the whole difference a
   * screen-reader user notices when they navigate back to the field later.
   */
  invalid?: true;
}

export interface FieldProps {
  /** Label above the control; omit for an unlabelled field. */
  label?: string;
  /** Error-chrome flag (boolean, as Checkbox/Radio); implied by `errorMessage`. */
  error?: boolean;
  /** Validation message below the control; its presence drives the error chrome. */
  errorMessage?: string;
  /** Explanatory text under the control ("what does this value actually do") —
   * muted, and read with the field via `aria-describedby` when the control is
   * wired through the render-function children's `describedBy`. Stacks under
   * `errorMessage` rather than yielding to it. */
  description?: string;
  /**
   * The control is a GROUP the platform will not associate by `for` — a
   * `<fieldset>`, most often a radio group. The `for` is dropped (it would
   * dangle) and the label's id is handed to the render-function children as
   * `labelledBy` instead, for the group to point back at.
   */
  grouped?: boolean;
  /** The inert look-alike — the label renders as a `<span>` (the inert twin). */
  nonInteractive?: boolean;
  /** The label treatment: `'floating'` renders the label as a chip punching
   * the control's outline; absent = the stacked block-above default. */
  theme?: 'floating' | 'none';
  /** Reserve the floating chip's overhang as top padding (default off — most
   * layouts already space their fields); opt in for a field in a tight stack. */
  reserveLabelSpace?: boolean;
  /** Explicit id; falls back to a generated one (`useId`). */
  id?: string;
  /** Extra class merged onto the field root. */
  className?: string;
  /** Overrides for the strings the field renders itself (the error prefix). */
  translations?: FieldTranslations;
  /** A control, or a render function receiving `{ id, className }` to wire it. */
  children?: ReactNode | ((props: FieldRenderProps) => ReactNode);
}

export function Field({ label, error, errorMessage, description, grouped, nonInteractive, theme, reserveLabelSpace, id, className, translations, children }: FieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const ids = fieldElementIds(fieldId);
  const labelId = label !== undefined ? ids.label : undefined;
  // An id only exists for a part that actually renders — a describedby pointing
  // at an absent element is a dangling reference, which is worse than none.
  const descriptionId = description !== undefined ? ids.description : undefined;
  const errorMessageId = errorMessage !== undefined ? ids.errorMessage : undefined;
  // The error chrome and the error STATE are the same condition: the bare
  // `error` flag is the message-less case, and a message implies the state.
  const invalid = error === true || errorMessage !== undefined;

  const content =
    typeof children === 'function'
      ? children({
          id: fieldId,
          className: 'DjuiField__input',
          describedBy: fieldDescribedBy(descriptionId, errorMessageId),
          labelledBy: labelId,
          invalid: invalid ? true : undefined,
        })
      : children;

  return (
    <FieldVisual
      className={className}
      label={label}
      error={error}
      errorMessage={errorMessage}
      description={description}
      labelId={labelId}
      descriptionId={descriptionId}
      errorMessageId={errorMessageId}
      translations={translations}
      nonInteractive={nonInteractive}
      theme={theme}
      reserveLabelSpace={reserveLabelSpace}
      htmlFor={nonInteractive || grouped ? undefined : fieldId}
    >
      {content}
    </FieldVisual>
  );
}