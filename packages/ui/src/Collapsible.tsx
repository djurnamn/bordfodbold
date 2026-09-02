'use client';

import { useId, useState, type ReactNode } from 'react';

/**
 * `Collapsible` (React) — the disclosure **behaviour**, and nothing else. It
 * renders no element and owns no class: it holds the open state (uncontrolled
 * by default, `open` + `onOpenChange` to control it — the `value`/`defaultValue`
 * split), generates the id that pairs a toggle with what it discloses, and
 * hands both halves of that ARIA pairing to a scoped slot as two records the
 * call site spreads onto **the elements it renders itself**:
 *
 *   <Collapsible>
 *     {({ open, toggleProps, panelProps }) => (
 *       <>
 *         <button type="button" {...toggleProps}>Menu</button>
 *         <nav {...panelProps} hidden={!open}>…</nav>
 *       </>
 *     )}
 *   </Collapsible>
 *
 * The record and the focus then live on one element — a wrapper would hold the
 * ARIA while the control inside it took the focus (the overlay family's `trigger`
 * seam, for the same reason). Where the toggle sits is the call site's business:
 * inside the panel (an off-canvas panel whose toggle rides its edge) or beside
 * it (a static button in a header).
 *
 * Deliberately NOT in the bags: anything that hides the panel. `hidden`, `inert`
 * and `visibility` are the call site's — the shells hide their off-canvas panel
 * with a `visibility` rule scoped to a media query, because "closed" only means
 * anything below a breakpoint, and an attribute cannot be scoped to one. A
 * consumer whose panel is closed at every width sets `hidden={!open}` itself.
 *
 * Hand-written per target rather than a Zag machine: the collapsible machine
 * stamps `hidden` on its content and animates its height, which are the two
 * things this component must not do.
 */
export type CollapsibleToggleProps = {
  /** Spelled as the string: the targets disagree on how a `false` boolean attribute serialises. */
  'aria-expanded': 'true' | 'false';
  'aria-controls': string;
  onClick: () => void;
}

export type CollapsiblePanelProps = {
  id: string;
}

export interface CollapsibleScope {
  open: boolean;
  /** Spread onto the control that opens and closes the panel. */
  toggleProps: CollapsibleToggleProps;
  /** Spread onto the disclosed element. */
  panelProps: CollapsiblePanelProps;
}

export interface CollapsibleProps {
  /** Controlled open state; overrides the self-managed toggle. */
  open?: boolean;
  /** Initial open state for uncontrolled use. */
  defaultOpen?: boolean;
  /** Called with the next open state whenever the toggle is pressed. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Id for the disclosed element, which the toggle's `aria-controls` points at.
   * Generated when absent; supply it only to pin the value (SSR, a test, a
   * consumer's own reference).
   */
  id?: string;
  /** Scoped slot: the toggle and the panel, rendered by the call site. */
  children: (scope: CollapsibleScope) => ReactNode;
}

export function Collapsible({
  open: externalOpen,
  defaultOpen = false,
  onOpenChange,
  id,
  children,
}: CollapsibleProps) {
  const generatedId = useId();
  const panelId = id ?? generatedId;

  // Uncontrolled state seeds from `defaultOpen` only — the controlled prop
  // never seeds (the `value`/`defaultValue` split, as Tabs/Table).
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;

  const toggle = () => {
    const next = !open;
    if (externalOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return children({
    open,
    toggleProps: {
      'aria-expanded': open ? 'true' : 'false',
      'aria-controls': panelId,
      onClick: toggle,
    },
    panelProps: { id: panelId },
  });
}
