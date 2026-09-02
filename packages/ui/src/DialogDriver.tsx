'use client';

import { useId, type ReactNode } from 'react';
import * as dialog from '@zag-js/dialog';
import { useMachine, normalizeProps } from '@zag-js/react';
import { useLocale } from './locale';

/**
 * `DialogDriver` — **pure behaviour**: the `@zag-js/dialog` machine (focus trap,
 * initial focus and focus return, scroll lock, outside-press / Escape dismissal,
 * `role="dialog"` semantics, the trigger's `aria-haspopup` / `aria-expanded` /
 * `aria-controls` pairing) handed to a scoped slot (`children({ api })`). No
 * markup, styles or BEM — the scrim, the positioner and the panel are Visuals
 * (`DrawerRoot`, `DrawerVisual`) the `Modal` and `Drawer` compounds compose, and
 * the trigger is the consumer's own element.
 *
 * One driver for both dialog-shaped overlays — `Modal` (centered) and `Drawer`
 * (from an edge) — in Popout's driver shape: the children render at every
 * state and the driver owns no portal, so a consumer's trigger stays in the
 * page while the compound decides what to render when (`api.open`) and where
 * (a portal, or in place when a drawer is `contained`). It replaces the
 * controlled-only `ModalDriver`, which portalled and unmounted everything while
 * closed — right for a component with no trigger, and the reason Modal could
 * not have one.
 */
export type DialogApi = ReturnType<typeof dialog.connect>;

export interface DialogDriverProps {
  /** Controlled open state. */
  open?: boolean;
  defaultOpen?: boolean;
  /** Called with the next open state on every machine-driven open/close. */
  onOpenChange?: (open: boolean) => void;
  /** Accessible name for the dialog when the panel renders no visible title. */
  label?: string;
  /** Trap focus, hide the rest of the page from assistive tech, block outside pointer interaction (default true). */
  modal?: boolean;
  /** Lock the page's scroll while open (default true; off when contained). */
  preventScroll?: boolean;
  /** Whether Escape closes the panel (default true). */
  closeOnEscape?: boolean;
  /** Whether an outside press closes the panel (default true). */
  closeOnInteractOutside?: boolean;
  /** The dialog's role (default `dialog`); `alertdialog` also moves initial focus to the content. */
  role?: 'dialog' | 'alertdialog';
  /**
   * Scoped slot: receives the live dialog api; render the trigger and, when
   * `api.open`, the panel. Called with a `{ api }` scope object to match the
   * engine's scoped-slot consumer emission (`{({ api }) => …}`).
   */
  children: (scope: { api: DialogApi }) => ReactNode;
}

export function DialogDriver({
  open,
  defaultOpen,
  onOpenChange,
  label,
  modal = true,
  preventScroll = true,
  closeOnEscape = true,
  closeOnInteractOutside = true,
  role,
  children,
}: DialogDriverProps) {
  const localeContext = useLocale();
  const service = useMachine(dialog.machine, {
    id: useId(),
    dir: localeContext.dir,
    open,
    defaultOpen,
    onOpenChange: (details) => onOpenChange?.(details.open),
    'aria-label': label,
    modal,
    preventScroll,
    closeOnEscape,
    closeOnInteractOutside,
    role,
  });
  const api = dialog.connect(service, normalizeProps);

  return children({ api });
}
