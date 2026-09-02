/**
 * Field — the runtime half of the error contract: the ids the wrapper and its
 * control agree on, and the English the message needs when a consumer supplies
 * no translation.
 *
 * The contract exists because the wrapper is the only part that knows both the
 * field id and whether there is a message to point at. A control cannot derive
 * either, and every control needs the same three things done identically:
 *
 *  - the message element gets an id,
 *  - the control's `aria-describedby` carries it (alongside the description's,
 *    when both render),
 *  - the control is marked `aria-invalid`.
 *
 * Doing that once here, rather than nine times across the controls, is what
 * makes the treatment uniform instead of dependent on whether a Zag machine
 * happened to be involved — four of djui's error-taking controls used to get
 * `aria-invalid` from their machine and five got nothing at all.
 *
 * Deliberately NOT a live region. `aria-describedby` is what the evidence
 * supports for an inline message: a live region on the same node produces
 * double announcements in several screen-reader and browser pairings, and one
 * that receives focus does not need announcing at all. A submit-time error
 * summary is a separate element and a separate decision.
 */

/** The ids a field derives from its own, for the parts a consumer must reach. */
export interface FieldElementIds {
  /** The label, for a control that cannot be associated by `for`. */
  label: string;
  /** The validation message, when the field has one. */
  errorMessage: string;
  /** The explanatory text, when the field has one. */
  description: string;
}

/** Derives the part ids from the field id. */
export function fieldElementIds(id: string): FieldElementIds {
  return {
    label: `${id}-label`,
    errorMessage: `${id}-error`,
    description: `${id}-description`,
  };
}

/**
 * The `aria-describedby` value for a control, given whichever of the two
 * descriptive parts actually render.
 *
 * Order is description then message, matching the reading order on screen and
 * the convention GOV.UK settled on: the explanatory text sets up the field, the
 * error says what went wrong with it. Returns `undefined` when neither renders,
 * so the attribute is omitted rather than emitted empty.
 */
export function fieldDescribedBy(
  descriptionId: string | undefined,
  errorMessageId: string | undefined
): string | undefined {
  const ids = [descriptionId, errorMessageId].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}
