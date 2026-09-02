'use client';

import { createContext, useContext, type ComponentType, type ReactNode } from 'react';

/** djui's canonical glyph vocabulary — the `Icon` `name` set. */
export type IconName = 'moon' | 'sun' | 'menu' | 'x' | 'chevron-down' | 'chevron-up' | 'chevron-left' | 'chevron-right' | 'chevrons-left' | 'chevrons-right' | 'check' | 'user' | 'search' | 'languages' | 'plus' | 'minus' | 'grip-vertical' | 'upload' | 'copy';

/**
 * A glyph implementation: any component that renders an icon. It receives the
 * resolved glyph `name` plus the same `size` / `strokeWidth` the built-in
 * `FallbackIcon` would (rem sizing via the `.DjuiIcon` rule), and is responsible
 * for stamping `DjuiIcon` itself. Forwarding `name` lets a single component serve
 * the whole vocabulary (`@djui/lucide`'s `LucideIcon` name-switches over Lucide) —
 * and lets a satellite whose icons are named differently map djui's `name` to its
 * own inside that one component.
 */
export type IconComponent = ComponentType<{ name: IconName; size?: number; strokeWidth?: number }>;

/**
 * The glyph vocabulary mapped to implementations. Every entry is optional — an
 * unset glyph falls through to core's built-in `FallbackIcon` fallback, so a partial
 * registry is valid.
 */
export type IconRegistry = Partial<Record<IconName, IconComponent>>;

/**
 * The active glyph registry. Defaults to empty — with no `IconProvider` mounted
 * every glyph resolves to its built-in fallback (the no-library baseline). The
 * Vue/Svelte drivers mirror this shape via provide-inject / context.
 */
const IconRegistryContext = createContext<IconRegistry>({});

export interface IconProviderProps {
  /** Icon `name` → implementation, e.g. `@djui/lucide`'s `lucideIcons` preset. */
  icons: IconRegistry;
  children?: ReactNode;
}

/**
 * Registers a glyph map for everything below it, so an installed icon library
 * replaces the built-in fallbacks everywhere with no per-component props
 * (tier 2 — "the magic"). A nested provider overrides in place.
 */
export function IconProvider({ icons, children }: IconProviderProps) {
  return <IconRegistryContext.Provider value={icons}>{children}</IconRegistryContext.Provider>;
}

/** Read the active registry (empty when no provider is mounted). */
export function useIconRegistry(): IconRegistry {
  return useContext(IconRegistryContext);
}