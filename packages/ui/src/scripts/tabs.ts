/**
 * Tabs — the element ids the strip and its panels agree on, plus the panel
 * record a consumer-rendered pane needs. Shared by all three targets.
 *
 * The compound (`Tabs > TabList + TabPanel`) needs none of this: the machine
 * generates its own ids and `TabPanel` reads them off the api through context.
 * This is for the *other* arrangement — the consumer renders the strip alone
 * and owns the panel itself, because the panel cannot be a descendant of the
 * strip's root: a sticky strip over a form's own section container, a pane that
 * sits between the strip and a submit row, a pane a page composes from
 * elsewhere in its tree. Strip-only, the machine still points the selected
 * trigger's `aria-controls` at a panel id, and with no `TabPanel` rendered that
 * reference resolves to nothing — a tab that controls an element which does not
 * exist, and no `role="tabpanel"` anywhere in the document.
 *
 * The fix is one shared id scheme. `Tabs` takes an `id`; every part's id is
 * derived from it here and handed to the machine, so a consumer can compute the
 * same ids without reaching into the machine. `tabsPanelProps` then returns the
 * panel record — the same `role` / `aria-labelledby` / `tabIndex` the machine
 * puts on its own `TabPanel` — for the consumer's element.
 *
 * Two arrangements, differing only in the panel id:
 *
 * - `per-tab` — one panel per tab, each with its own id. The default, and what
 *   the compound renders.
 * - `shared` — ONE pane element for every tab: the shape a sectioned form
 *   takes, where every section lives in a single always-visible container and
 *   the strip only decides which section is on show. WAI-ARIA expects a
 *   tabpanel per tab and one element cannot be several panels, so the pane *is*
 *   the selected tab's panel: a single `role="tabpanel"` with a stable id,
 *   labelled by whichever trigger is active. Selection moves the label, never
 *   the element. (The alternative — an id that changes with the active tab —
 *   keeps `aria-controls` truthful too, but gives the region a new identity on
 *   every switch, which nothing else in the document can hold on to. The
 *   consumer's tree has one pane, so djui names one pane.)
 */

/** How many panels the arrangement has — see the module note. */
export type TabsPanelArrangement = 'per-tab' | 'shared';

/**
 * The id of every part, derived from the `id` given to `Tabs`. Handed to the
 * machine as its `ids` record, so the ids a consumer computes are the ids the
 * strip actually renders.
 */
export interface TabsElementIds {
  root: string;
  list: string;
  trigger: (value: string) => string;
  content: (value: string) => string;
}

/**
 * Derives the id record from the consumer's `id`. `shared` collapses the panel
 * id to one value-independent id, which is what makes the selected trigger's
 * `aria-controls` point at the single pane.
 */
export function tabsElementIds(
  id: string,
  panels: TabsPanelArrangement = 'per-tab'
): TabsElementIds {
  return {
    root: id,
    list: `${id}-tablist`,
    trigger: (value: string) => `${id}-tab-${value}`,
    content: panels === 'shared' ? () => `${id}-panel` : (value: string) => `${id}-panel-${value}`,
  };
}

export interface TabsPanelOptions {
  /** The `id` given to `Tabs`. */
  id: string;
  /** The tab this panel belongs to — for a shared pane, the active tab. */
  value: string;
  /** Must match the `panels` prop on `Tabs`. */
  panels?: TabsPanelArrangement;
}

/** The panel contract, matching what the machine puts on its own `TabPanel`. */
export interface TabsPanelProps {
  id: string;
  role: 'tabpanel';
  'aria-labelledby': string;
  tabIndex: number;
}

/**
 * The props for a panel the consumer renders itself. Spread onto the element —
 * on `TabPanelVisual` to take djui's pane appearance with it, on anything else
 * to take the contract alone.
 *
 * `tabIndex: 0` is the machine's own value for a composite tablist (its
 * default): the panel is reachable in the tab sequence after its trigger.
 * Visibility is deliberately absent — an external panel is external precisely
 * because the consumer decides whether an inactive one is hidden, unmounted, or
 * (the shared pane) never a separate element at all.
 */
export function tabsPanelProps({ id, value, panels }: TabsPanelOptions): TabsPanelProps {
  const ids = tabsElementIds(id, panels);
  return {
    id: ids.content(value),
    role: 'tabpanel',
    'aria-labelledby': ids.trigger(value),
    tabIndex: 0,
  };
}
