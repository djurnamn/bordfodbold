'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DEFAULT_LOCALE, resolveLocale, type DjuiDirection, type DjuiLocale } from './scripts';

/**
 * The locale carrier's React half — a context in the icon registry's shape.
 * `LocaleProvider` states the BCP 47 tag (and, when the tag's script does not
 * decide it, the writing direction) for everything below it; every
 * machine-backed driver reads it with `useLocale` *during render*, so a
 * server render and the client's agree, and a provider that changes locale
 * re-renders what depends on it with no bridge in between.
 *
 * With no provider mounted the value is `en-US`, left-to-right — stated, not
 * inferred from the runtime, which is what would differ between server and
 * client. A right-to-left host mounts the provider with its tag; the machines
 * then stamp `dir="rtl"` on their roots and reverse their horizontal keys.
 */
const LocaleContext = createContext<DjuiLocale>(DEFAULT_LOCALE);

export interface LocaleProviderProps {
  /** A BCP 47 language tag — `sv-SE`, `ar`, `en-US`. */
  locale?: string;
  /** The writing direction; derived from the tag unless stated. */
  dir?: DjuiDirection;
  children?: ReactNode;
}

/** States the locale for everything below it. A nested provider overrides in place. */
export function LocaleProvider({ locale, dir, children }: LocaleProviderProps) {
  const value = useMemo(() => resolveLocale({ locale, dir }), [locale, dir]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** The locale in scope (`en-US` / `ltr` when no provider is mounted). */
export function useLocale(): DjuiLocale {
  return useContext(LocaleContext);
}
