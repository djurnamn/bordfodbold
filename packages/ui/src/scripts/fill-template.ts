/**
 * The placeholder filler behind the serializable label siblings — the string
 * form a server-rendered page can pass where the machine wants a function
 * (`resolvePageUrl`, `resolvePaginationTranslations`,
 * `resolveFileUploadTranslations`, `resolveProgressTranslations`). Internal to
 * `djui/scripts`: the drivers reach it through those resolvers, never directly.
 */

/**
 * Fills `{name}` placeholders in `template` from `values`; a placeholder with
 * no matching value passes through untouched, so a label reading `{unknown}`
 * shows the author what was misspelled rather than swallowing it.
 */
export function fillTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{([a-zA-Z]+)\}/g, (placeholder, name) =>
    name in values ? String(values[name]) : placeholder
  );
}
