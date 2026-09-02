'use client';

import { useId, type ReactNode } from 'react';
import type { DjuiColorToken, TabsPanelArrangement, TabsTranslations } from './scripts';
import { resolveTabsTranslations, tabsElementIds } from './scripts';
import * as tabs from '@zag-js/tabs';
import { useMachine, normalizeProps } from '@zag-js/react';
import { useLocale } from './locale';

import { TabsVisual } from './TabsVisual';
import { TabListVisual } from './TabListVisual';
import { TabVisual } from './TabVisual';
import { TabPanelVisual } from './TabPanelVisual';
import { TabsContext, useTabsContext } from './tabs-context';

/**
 * `Tabs` — the compound's **behaviour**: the Zag.js `tabs` machine (active-tab
 * state, controlled/uncontrolled, roving-tabindex keyboard navigation, ARIA) and
 * the context that shares the live api with its subcomponents. It owns no markup
 * or styles — the appearance is the generated `TabsVisual` / `TabListVisual` /
 * `TabVisual` / `TabPanelVisual`, which it composes and spreads the machine's
 * getter records onto.
 *
 * Compound API:
 *
 *   <Tabs defaultValue="home">
 *     <TabList>
 *       <Tab value="home">Home</Tab>
 *       <Tab value="docs">Docs</Tab>
 *     </TabList>
 *     <TabPanel value="home">…</TabPanel>
 *     <TabPanel value="docs">…</TabPanel>
 *   </Tabs>
 *
 * A consumer whose panel cannot be a descendant of the root renders the strip
 * alone and takes the panel contract from `djui/scripts` instead:
 *
 *   <Tabs id="settings" panels="shared" value={active} onChange={setActive}>
 *     <TabList>…</TabList>
 *   </Tabs>
 *   <TabPanelVisual
 *     standalone
 *     surfaceDirection="current"
 *     {...setSurface(3)}
 *     {...tabsPanelProps({ id: 'settings', value: active, panels: 'shared' })}
 *   >
 *     …
 *   </TabPanelVisual>
 *
 * (`current` is the fill for a pane that pins its own surface level, which a
 * detached pane does so its descendants stamp from it — see `TabPanelVisual`
 * for the direction rule.)
 */
export interface TabsProps {
  /**
   * A stable id for the strip. Every part's id derives from it — `<id>-tablist`,
   * `<id>-tab-<value>`, `<id>-panel-<value>` — so a consumer rendering the panel
   * itself computes the same ids through `tabsPanelProps` (`djui/scripts`).
   * Unset, the machine generates its own ids and only `TabPanel` can reach them.
   */
  id?: string;
  /**
   * How many panels the arrangement has: one per tab (the default, what
   * `TabPanel` renders) or a single shared pane for every tab. `shared` pins the
   * machine's panel id to one value-independent id, so the selected tab's
   * `aria-controls` points at that one pane. Takes effect with `id`, since a
   * consumer-rendered pane is the only thing that has a shared panel.
   */
  panels?: TabsPanelArrangement;
  /** Controlled active tab value. */
  value?: string;
  /** Initial active tab for uncontrolled use. */
  defaultValue?: string;
  /** Called with the new active value when the selection changes. */
  onChange?: (value: string) => void;
  /** Active-tab fill for the non-folder themes (`soft` default). */
  variant?: 'soft' | 'solid';
  /** Any djui color token — tints the active fill. */
  color?: DjuiColorToken;
  /** `folder` opts into the surface-oriented folder theme. */
  theme?: 'folder' | 'none';
  /** Folder theme only: which surface the active tab + panel pop to. */
  surfaceDirection?: 'next' | 'previous';
  /** Base font-size in rem for the strip (padding/icon scale with it). */
  size?: number;
  /** The tablist's accessible name (English default: "Tabs"). */
  translations?: TabsTranslations;
  /** Extra class merged onto the strip root. */
  className?: string;
  children?: ReactNode;
}

export function Tabs({
  id,
  panels,
  value,
  defaultValue,
  onChange,
  variant,
  color,
  theme,
  surfaceDirection = 'next',
  size,
  translations,
  className,
  children,
}: TabsProps) {
  const generatedId = useId();
  const localeContext = useLocale();
  const service = useMachine(tabs.machine, {
    id: id ?? generatedId,
    dir: localeContext.dir,
    // Only when the consumer named the strip: without an `id` the derived ids
    // are no more reachable than the machine's own, so the machine keeps them.
    ids: id ? tabsElementIds(id, panels) : undefined,
    value,
    defaultValue,
    translations: resolveTabsTranslations(translations),
    onValueChange: onChange ? (details) => onChange(details.value) : undefined,
  });
  const api = tabs.connect(service, normalizeProps);
  const surfaceShift = theme === 'folder' && surfaceDirection !== 'previous';

  return (
    <TabsContext.Provider value={{ api, surfaceShift }}>
      <TabsVisual
        {...api.getRootProps()}
        className={className}
        variant={variant}
        color={color}
        theme={theme}
        surfaceDirection={surfaceDirection}
        size={size}
      >
        {children}
      </TabsVisual>
    </TabsContext.Provider>
  );
}

export interface TabListProps {
  /** Extra class merged onto the strip row root. */
  className?: string;
  children?: ReactNode;
}

export function TabList({ className, children }: TabListProps) {
  const { api } = useTabsContext();
  return (
    <TabListVisual className={className} listProps={api.getListProps()}>
      {children}
    </TabListVisual>
  );
}

export interface TabProps {
  /** Identifies this tab; matched against the active value. */
  value: string;
  /** Extra class merged onto the trigger root. */
  className?: string;
  children?: ReactNode;
}

export function Tab({ value, className, children }: TabProps) {
  const { api, surfaceShift } = useTabsContext();
  const selected = api.value === value;
  return (
    <TabVisual
      {...api.getTriggerProps({ value })}
      className={className}
      active={selected}
      surfaceShift={surfaceShift && selected}
    >
      {children}
    </TabVisual>
  );
}

export interface TabPanelProps {
  /** Identifies the panel; matched against the active value. */
  value: string;
  /** Extra class merged onto the panel root. */
  className?: string;
  children?: ReactNode;
}

export function TabPanel({ value, className, children }: TabPanelProps) {
  const { api, surfaceShift } = useTabsContext();
  return (
    <TabPanelVisual
      {...api.getContentProps({ value })}
      className={className}
      surfaceShift={surfaceShift}
    >
      {children}
    </TabPanelVisual>
  );
}