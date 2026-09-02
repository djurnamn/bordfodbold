/**
 * The locale carrier — the two scalars a component needs before it renders a
 * single string: the BCP 47 tag for `Intl`, and the writing direction for the
 * machines that read it. Shared by all three targets; the per-target
 * `LocaleProvider` / `useLocale` pair (a context, in the icon registry's
 * shape) carries the resolved value down the tree, and every machine-backed
 * driver reads it during render.
 *
 * Two rules, both kept on purpose:
 *
 * - **A value, never a registry.** The carrier flows down the tree; nothing
 *   here is module-level state. Held in a module global, the same two strings
 *   would need a bespoke reactivity bridge per target, and a server render
 *   could never see what the client set.
 * - **Never ambient.** With no provider the locale is `en-US`, stated — not
 *   whatever `Intl` resolves from the runtime, which is the server's on the
 *   server and the browser's on the client and so differs between the two
 *   halves of one hydration.
 *
 * The tag is a *formatting* locale only. It parameterises `Intl` and the
 * machines; it never selects a string — the strings stay on each component's
 * `translations` prop, where a message bundle of any shape can feed them.
 */

import { formatNumber as formatNumberCached, isRTL } from '@zag-js/i18n-utils';

/** The writing direction of a locale. */
export type DjuiDirection = 'ltr' | 'rtl';

/** The resolved carrier: both scalars always present. */
export interface DjuiLocale {
  /** A BCP 47 language tag — `sv-SE`, `ar`, `en-US`. */
  locale: string;
  /** The writing direction; derived from the tag unless stated. */
  dir: DjuiDirection;
}

/** What a provider accepts: either scalar optional, `dir` derived when absent. */
export interface DjuiLocaleInput {
  locale?: string;
  dir?: DjuiDirection;
}

/** The value in scope when no provider is mounted. */
export const DEFAULT_LOCALE: DjuiLocale = { locale: 'en-US', dir: 'ltr' };

/**
 * Resolves a provider's input into the complete carrier: the tag as given (or
 * the default), the direction as given or derived from the tag's script.
 */
export function resolveLocale(input: DjuiLocaleInput | undefined): DjuiLocale {
  const locale = input?.locale ?? DEFAULT_LOCALE.locale;
  const dir = input?.dir ?? (isRTL(locale) ? 'rtl' : 'ltr');
  return { locale, dir };
}

/**
 * A number the kit renders itself, in the carrier's locale — a page number,
 * a slider's value. One implementation for every target, with the formatter
 * cached per locale and options.
 */
export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  return formatNumberCached(value, locale, options);
}
