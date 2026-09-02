'use client';

import { FallbackIcon } from './FallbackIcon';
import { useIconRegistry, type IconName } from './icon-registry';

/**
 * `Icon` — the registry-aware icon resolver, the runtime seam that makes the icon
 * registry reach the generated Visuals. A Visual references
 * it in its fallback slot (`tag: 'FallbackIcon'` → react/vue/svelte override
 * `'Icon'`, the per-target tag override). It renders, in order:
 *
 *   1. explicit per-instance icon — handled upstream by the Visual's slot, so it
 *      never reaches here;
 *   2. the registered glyph for `name` (an `IconProvider` is mounted) — "the magic";
 *   3. core's built-in `FallbackIcon` — the zero-dependency floor.
 *
 * Transparent stand-in: the resolved `name` + `size` / `strokeWidth` forward
 * unchanged to whichever renders (so one registered component can serve the whole
 * vocabulary). HTML, having no runtime registry, keeps `FallbackIcon` directly.
 */
export function Icon({ name, ...props }: { name: IconName; size?: number; strokeWidth?: number }) {
  const Registered = useIconRegistry()[name];
  return Registered ? <Registered name={name} {...props} /> : <FallbackIcon name={name} {...props} />;
}