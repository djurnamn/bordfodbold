/**
 * `SlugInput`'s canonicalization runtime — the default `slugify` shared by all
 * three drivers. Dependency-free on purpose: slug policy beyond this (locale
 * transliteration tables, reserved words, collision suffixes) is the
 * application's, passed in through the drivers' `slugify` prop — and a client
 * preview is only trustworthy when it applies the same rules the server will,
 * so an application that canonicalizes server-side should pass that same
 * function here.
 */

// Characters that do NOT decompose under NFD, so the diacritic strip alone
// would drop them. Mapped to a Latin transliteration first; å/ä/ö/é/ü DO
// decompose (base letter + combining mark) and need no entry.
const TRANSLITERATE: Record<string, string> = {
  ø: 'o',
  æ: 'ae',
  œ: 'oe',
  ß: 'ss',
  ð: 'd',
  þ: 'th',
  ł: 'l',
  đ: 'd',
};

/**
 * Derive a URL-safe slug from arbitrary text: transliterate the
 * non-decomposing Latin letters (ø→o, æ→ae, ß→ss), strip diacritics
 * (å→a, ö→o, é→e), lowercase, collapse everything else to single hyphens.
 * Returns `''` when nothing survives (all punctuation, non-Latin scripts) —
 * callers decide the fallback.
 */
export function resolveSlug(value: string): string {
  return value
    .replace(/[øæœßðþłđ]/gi, (character) => TRANSLITERATE[character.toLowerCase()] ?? character)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
