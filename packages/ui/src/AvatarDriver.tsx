'use client';

import { useId, type ReactNode } from 'react';
import * as avatar from '@zag-js/avatar';
import { useMachine, normalizeProps } from '@zag-js/react';
import { useLocale } from './locale';

/**
 * `AvatarDriver` — **pure behaviour** (the pure-driver model): the
 * Zag `avatar` machine (image load tracking → fallback toggling) handed to a
 * scoped slot (`children({ api })`). No markup, styles, or BEM — the appearance
 * is `AvatarVisual`, wired by the generated `Avatar` compound.
 *
 * `onStatusChange(status)` is a discrete lifecycle notification (the image
 * `loaded`/`error`), named as the event — the `onOpenChange` precedent, not
 * a controlled-value change.
 */
export type AvatarApi = ReturnType<typeof avatar.connect>;

export interface AvatarDriverProps {
  /** Called when the image load status resolves (`'loaded' | 'error'`). */
  onStatusChange?: (status: 'loaded' | 'error') => void;
  /**
   * Scoped slot: receives the live avatar api; render the Visual. Called with a
   * `{ api }` scope object to match the engine's scoped-slot consumer emission,
   * so the generated `Avatar` compound composes this driver directly.
   */
  children: (scope: { api: AvatarApi }) => ReactNode;
}

export function AvatarDriver({ onStatusChange, children }: AvatarDriverProps) {
  const localeContext = useLocale();
  const service = useMachine(avatar.machine, {
    id: useId(),
    dir: localeContext.dir,
    onStatusChange: (details) => onStatusChange?.(details.status),
  });
  const api = avatar.connect(service, normalizeProps);

  return children({ api });
}
