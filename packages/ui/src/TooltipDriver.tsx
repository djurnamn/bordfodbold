'use client';

import { useId, type ReactNode } from 'react';
import * as tooltip from '@zag-js/tooltip';
import type { Placement } from '@zag-js/tooltip';
import { useMachine, normalizeProps } from '@zag-js/react';
import { useLocale } from './locale';

/**
 * `TooltipDriver` — **pure behaviour**, migrated off
 * `@floating-ui/react` onto the shared Zag.js foundation. It owns only the Zag
 * `tooltip` machine (hover/focus open with delays, dismiss, positioning) and hands
 * the live `api` to a scoped slot (`children({ api })`). No markup, styles, or BEM — the
 * trigger and bubble are Visuals (`TooltipTrigger`, `TooltipVisual`) the compound
 * composes, spreading the api's getter records onto their passthrough roots.
 *
 * Unlike the modal it does not gate on `open` or own a portal: the trigger renders
 * inline always; only the bubble is portalled, by the compound. The driver is the
 * one hand-written per-framework piece (irreducible runtime).
 */
export type TooltipApi = ReturnType<typeof tooltip.connect>;

export interface TooltipDriverProps {
  openDelay?: number;
  closeDelay?: number;
  placement?: Placement;
  /** Whether the bubble itself is hoverable (keeps it open on pointer-in). */
  interactive?: boolean;
  /** Force the open state — primarily for previews/tests. */
  open?: boolean;
  /** Distance in px between the trigger and the bubble (Zag's default when absent). */
  gutter?: number;
  defaultOpen?: boolean;
  /** Called with the next open state on every machine-driven open/close. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Scoped slot: receives the live tooltip api; render the trigger + bubble.
   * Called with a `{ api }` scope object to match the engine's scoped-slot
   * consumer emission (`{({ api }) => …}`), so the generated `Tooltip` compound
   * composes this driver directly.
   */
  children: (scope: { api: TooltipApi }) => ReactNode;
}

export function TooltipDriver({
  openDelay = 300,
  closeDelay = 0,
  placement = 'top',
  gutter,
  interactive = false,
  open,
  defaultOpen,
  onOpenChange, children,
}: TooltipDriverProps) {
  const localeContext = useLocale();
  const service = useMachine(tooltip.machine, {
    id: useId(),
    dir: localeContext.dir,
    openDelay,
    closeDelay,
    interactive,
    open,
    defaultOpen,
    onOpenChange: (details) => onOpenChange?.(details.open),
    positioning: { placement, gutter },
  });
  const api = tooltip.connect(service, normalizeProps);

  return children({ api });
}