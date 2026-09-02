'use client';

import { createContext, useContext } from 'react';
import type * as tabs from '@zag-js/tabs';

/**
 * The live tabs api shared from the `Tabs` root down to `TabList` / `Tab` /
 * `TabPanel`. They are arbitrary-depth descendants the consumer authors, so the
 * api reaches them through React context rather than a scoped slot (which only
 * crosses one explicit composition boundary). The Vue/Svelte drivers use the
 * same shape via their own provide-inject / context primitives.
 */
export interface TabsContextValue {
  api: ReturnType<typeof tabs.connect>;
  /**
   * Whether the active tab and the content panel should emit the
   * `data-djui-next-surface` shift — the folder theme's `next` direction. The
   * `Tab` driver gates it on selection; the panel always carries it.
   */
  surfaceShift: boolean;
}

export const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs subcomponents (TabList, Tab, TabPanel) must be used within <Tabs>.');
  }
  return context;
}