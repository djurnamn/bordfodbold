/**
 * Progress's value-text runtime — the serializable sibling of the `progress`
 * machine's function-only `translations.value`, shared by all three targets.
 * This one is not only an accessible label: djui's `Progress` renders the
 * machine's `valueAsString` as the bar's **visible** value text (`showValue`),
 * so the string this produces is read as well as announced. Functions cannot
 * cross a server→client component boundary, so the determinate text is
 * expressible as a template and the indeterminate state as a literal, and the
 * function the machine wants is created on the client side, inside the driver.
 */

import { fillTemplate } from './fill-template';

/** The values available to the bar's value text. */
export interface ProgressValueDetails {
  value: number | null;
  min: number;
  max: number;
  percent: number;
  formatter?: Intl.NumberFormat;
}

/**
 * The drivers' value-text overrides — the progress machine's translation
 * record (its field name kept verbatim), with `value` widened to also accept a
 * template string and the indeterminate state split out as its own literal,
 * the two serializable forms a server-rendered page can pass whole. The
 * indeterminate text is a separate literal rather than a placeholder because
 * it is a *branch* of the same seam, and a template has nothing to fill there
 * (the `firstPageUrl` shape, not the `itemLabel` one).
 *
 * Template placeholders: `{formatted}` (the value through the machine's own
 * `Intl.NumberFormat` — keep this in the template to preserve locale-aware
 * number formatting), `{value}`, `{percent}`, `{min}`, `{max}`. E.g.
 * `"{formatted} klart"`.
 */
export interface ProgressTranslations {
  /** The determinate value text (English default: the formatted value alone). */
  value?: string | ((details: ProgressValueDetails) => string);
  /** The indeterminate (`value: null`) text (English default: "Loading…"). */
  indeterminate?: string;
}

/** The record the machine takes: the value function, always present. */
export interface ResolvedProgressTranslations {
  value: (details: ProgressValueDetails) => string;
}

/**
 * The determinate formatting: the value through the machine's formatter (as a
 * fraction when the formatter is a percent one). The one implementation — the
 * resolver always hands the machine a function, so the machine's own default
 * never runs and this cannot drift from it unnoticed.
 */
function formatValue(details: ProgressValueDetails): string {
  if (details.value === null) return '';
  const { formatter } = details;
  if (!formatter) return String(details.value);
  const percentStyle = formatter.resolvedOptions().style === 'percent';
  return formatter.format(percentStyle ? details.percent / 100 : details.value);
}

/**
 * Resolves a `ProgressTranslations` record into the complete, function-only
 * shape the machine takes. The returned function owns both branches:
 * `indeterminate` (the kit's English when unset) when the value is null,
 * otherwise the template filled, the given function called, or — when only
 * `indeterminate` was given — the formatted value alone, so overriding one
 * branch never silently drops the other.
 */
export function resolveProgressTranslations(
  translations: ProgressTranslations | undefined
): ResolvedProgressTranslations {
  const value = translations?.value;
  const indeterminate = translations?.indeterminate;
  return {
    value: (details) => {
      if (details.value === null) return indeterminate ?? 'Loading…';
      if (typeof value === 'function') return value(details);
      if (typeof value === 'string') {
        return fillTemplate(value, {
          formatted: formatValue(details),
          value: details.value,
          percent: details.percent,
          min: details.min,
          max: details.max,
        });
      }
      return formatValue(details);
    },
  };
}
