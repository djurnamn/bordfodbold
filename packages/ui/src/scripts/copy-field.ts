/**
 * CopyField's accessible-label runtime — the serializable sibling of the
 * `CopyField` drivers' function-only label seam, shared by all three targets.
 * Functions cannot cross a server→client component boundary, and a
 * server-rendered page in a localized application is the natural author of
 * exactly these strings, so the trigger label is expressible as a plain pair —
 * one string per state — and the function the machine wants is created on the
 * client side, inside the driver. The function form wins when both could
 * apply (the `rowHref` / `rowHrefKey` precedent on Table).
 */

/** The copy button's accessible label in each of its two states. */
export interface CopyFieldTriggerLabels {
  /** The idle label, before a copy — e.g. "Kopiera till urklipp". */
  copy: string;
  /** The copied label, also announced in the live region — e.g. "Kopierad till urklipp". */
  copied: string;
}

/**
 * The drivers' accessible-label overrides — the clipboard machine's
 * translation record (its field name kept verbatim), with `triggerLabel`
 * widened to also accept a `{ copy, copied }` pair of strings, the
 * serializable form a server-rendered page can pass whole. The label depends
 * on a state rather than on values, so the sibling is a literal per branch — a
 * template string has no branch to fill (the `firstPageUrl` shape, not the
 * `itemLabel` one).
 */
export interface CopyFieldTranslations {
  /** The trigger's label per state (English defaults: "Copy to clipboard" / "Copied to clipboard"). */
  triggerLabel?: CopyFieldTriggerLabels | ((copied: boolean) => string);
}

/** The record the machine takes: the state-picking function, always present. */
export interface ResolvedCopyFieldTranslations {
  triggerLabel: (copied: boolean) => string;
}

/**
 * Resolves a `CopyFieldTranslations` record into the complete, function-only
 * shape the machine takes: a `{ copy, copied }` pair becomes the state-picking
 * function, a function passes through, and an absent record resolves to the
 * kit's English. Both states are required in the pair form, so a localized
 * field can never half-fall back to English. The copied branch is also what
 * the field's live region announces.
 */
export function resolveCopyFieldTranslations(
  translations: CopyFieldTranslations | undefined
): ResolvedCopyFieldTranslations {
  const triggerLabel = translations?.triggerLabel;
  if (typeof triggerLabel === 'function') return { triggerLabel };
  const labels = triggerLabel ?? { copy: 'Copy to clipboard', copied: 'Copied to clipboard' };
  return { triggerLabel: (copied) => (copied ? labels.copied : labels.copy) };
}
