/**
 * Combobox's option filter — the one implementation the three drivers share.
 * Locale-aware where a bare `toLowerCase().includes()` is not: the comparison
 * runs through an `Intl.Collator` at base sensitivity, so accents fold
 * (`e` matches `é`), case folds by the locale's own rules (a Turkish dotted
 * I stays one letter), and composed and decomposed forms of the same
 * character compare equal.
 */

import { createFilter } from '@zag-js/i18n-utils';

/** The filters, one per locale — a collator is not free to build. */
const filters = new Map<string, ReturnType<typeof createFilter>>();

function filterFor(locale: string): ReturnType<typeof createFilter> {
  let filter = filters.get(locale);
  if (!filter) {
    filter = createFilter({ locale, sensitivity: 'base' });
    filters.set(locale, filter);
  }
  return filter;
}

/**
 * The options whose label contains the typed text, compared in the given
 * locale. Empty text returns the options untouched.
 */
export function filterComboboxOptions<Option extends { label: string }>(
  options: Option[],
  text: string,
  locale: string
): Option[] {
  if (text === '') return options;
  const filter = filterFor(locale);
  return options.filter((option) => filter.contains(option.label, text));
}
