'use client';

import type { ReactNode } from 'react';
import type { AuthTemplateHeaderTranslations } from './scripts';
import { AuthTemplateHeaderVisual } from './AuthTemplateHeaderVisual';
import { Collapsible } from './Collapsible';

/**
 * `AuthTemplateHeader` (React) — the auth shell's header bar **behaviour**
 * composing the generated `AuthTemplateHeaderVisual` for all appearance (the
 * Visual/driver split, as `DashboardTemplate` and `DocsTemplate`). The
 * navigation's open state, its panel id and its `aria-expanded` /
 * `aria-controls` pairing are `Collapsible`'s; this driver composes it around
 * the Visual and forwards the three regions to the Visual's slots.
 *
 *   <AuthTemplateHeader
 *     brand={<Logo />}
 *     navigation={<><TextLink …/><TextLink …/></>}
 *     actions={<LanguageSwitcher …/>}
 *   />
 *
 * The inert twin (`nonInteractive`) is the controlled shape: the panel follows
 * the consumer's `navigationOpen` and the toggle is the inert `<div>`
 * look-alike. The interactive default self-manages the panel and renders the
 * toggle as a `<button>`.
 */
export interface AuthTemplateHeaderProps {
  /** The brand cluster at the leading edge. */
  brand?: ReactNode;
  /** The navigation cluster — centered on the bar from `small` up, an off-canvas panel below. */
  navigation?: ReactNode;
  /** The trailing actions cluster. */
  actions?: ReactNode;
  /** The inert look-alike — the toggle is a `<div>` and the panel is controlled. */
  nonInteractive?: boolean;
  /** Controlled navigation-panel state; overrides the self-managed toggle. */
  navigationOpen?: boolean;
  /** Called with the next panel state when the toggle is pressed. */
  onToggle?: (open: boolean) => void;
  /** The navigation toggle's accessible label (English default: "Toggle navigation"). */
  translations?: AuthTemplateHeaderTranslations;
  /** Extra class merged onto the header root. */
  className?: string;
}

export function AuthTemplateHeader({
  brand,
  navigation,
  actions,
  nonInteractive,
  navigationOpen,
  onToggle,
  translations,
  className,
}: AuthTemplateHeaderProps) {
  // Uncontrolled by default; a supplied `navigationOpen` makes the panel
  // controlled. The inert twin is always controlled (closed unless told).
  return (
    <Collapsible
      open={nonInteractive ? navigationOpen ?? false : navigationOpen}
      onOpenChange={onToggle}
    >
      {({ open, toggleProps, panelProps }) => (
        <AuthTemplateHeaderVisual
          className={className}
          nonInteractive={nonInteractive}
          navigationOpen={open}
          toggleProps={toggleProps}
          panelProps={panelProps}
          translations={translations}
          brand={brand}
          navigation={navigation}
          actions={actions}
        />
      )}
    </Collapsible>
  );
}
