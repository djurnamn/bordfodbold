/**
 * Table's sort-cycle runtime — the one bit of behaviour shared by all three
 * `Table` drivers, relocated here (the `djui/scripts` convention) so it is a
 * single pure function the drivers compose and a unit test can exercise directly
 * (the cycle can't be reached by server-rendered output — it needs a click —
 * nor by the live preview — observing the sort needs the consumer's `sortIcon`
 * render prop, which the JSON-only preview args can't carry).
 *
 * The cycle: clicking a column header advances `asc → desc → unsorted`;
 * a fresh column starts at `asc`.
 */
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  column: string | null;
  direction: SortDirection | null;
}

/**
 * The sort state after clicking `key`, given the current `sortedColumn` /
 * `sortDirection`. The active column steps `asc → desc → unsorted` (`null`/
 * `null`); any other column (or an unsorted grid) starts a fresh `asc` sort.
 */
export function nextSort(
  key: string,
  sortedColumn: string | null,
  sortDirection: SortDirection | null
): SortState {
  if (sortedColumn === key) {
    if (sortDirection === 'asc') return { column: key, direction: 'desc' };
    if (sortDirection === 'desc') return { column: null, direction: null };
  }
  return { column: key, direction: 'asc' };
}

/**
 * The row-link resolver shared by the `Table` drivers. The function form
 * (`rowHref`) wins; otherwise `rowHrefKey` names the row field carrying the
 * target URL, and the returned function reads it per row. The key form exists
 * because functions cannot cross a server→client component boundary: a
 * server-rendered page expresses "this row links there" with a plain
 * serializable string, and the function is created on the client side, inside
 * the driver. A row whose field is absent or not a string stays unlinked.
 * Generic over the row shape — the React target's rows carry `ReactNode`
 * values, the other targets `unknown`.
 */
export function resolveRowHref<Row extends Record<string, unknown>>(
  rowHref: ((row: Row) => string | undefined) | undefined,
  rowHrefKey: string | undefined
): ((row: Row) => string | undefined) | undefined {
  if (rowHref) return rowHref;
  if (!rowHrefKey) return undefined;
  return (row) => {
    const value = row[rowHrefKey];
    return typeof value === 'string' ? value : undefined;
  };
}

/**
 * The subset of a pointer event the row-click navigation reads — spelled as a
 * pick so React's synthetic event and the DOM event both satisfy it.
 */
export type RowClickEvent = Pick<
  MouseEvent,
  'button' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'defaultPrevented' | 'target'
>;

/**
 * The pointer half of a linkable row, shared by the three `Table` drivers.
 *
 * The link itself is a real `<a>` inside the row's link cell — the row's
 * accessible name, its keyboard target, the thing a middle-click or a modifier
 * key opens in a new tab. A plain click anywhere else on the row follows the
 * same href, so the whole row stays a pointer target. Everything the browser
 * would treat specially is left to the browser: a non-primary button or a
 * modifier key does nothing here (the link cell already carries those
 * affordances), a click that began on the link or on any other control in the
 * row is that control's, and a handler that called `preventDefault()` has
 * spoken. `navigate` is injectable so the rule is unit-testable without a
 * window.
 */
export function followRowLink(
  event: RowClickEvent,
  href: string | undefined,
  navigate: (target: string) => void = (target) => window.location.assign(target)
): void {
  if (!href || event.defaultPrevented) return;
  if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const origin = event.target as { closest?: (selector: string) => unknown } | null;
  if (origin?.closest?.('a, button, input, select, textarea, [contenteditable]')) return;
  navigate(href);
}
