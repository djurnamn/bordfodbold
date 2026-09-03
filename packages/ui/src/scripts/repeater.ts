/**
 * Repeater's row-list runtime — the pure array operations shared by the `Repeater`
 * driver, relocated here (the `djui/scripts` convention, as Table's `nextSort`) so
 * they are single pure functions a unit test can exercise directly. The driver
 * owns only React state + composition; every list transform lives here.
 *
 * A row is an open key→value bag; the repeater is UI-agnostic about what each
 * field holds (the field components — or `@djui/use-form-definition` — decide).
 */
export type RepeaterRow = Record<string, unknown>;

/** Append a fresh (default `{}`) row. */
export function addRepeaterRow(rows: RepeaterRow[], row: RepeaterRow = {}): RepeaterRow[] {
  return [...rows, row];
}

/** Remove the item at `index` (returns a new array; out-of-range is a no-op copy). */
export function removeRepeaterRow<T>(items: T[], index: number): T[] {
  return items.filter((_, i) => i !== index);
}

/** Set one field on the row at `index` (returns a new array; other rows untouched). */
export function setRepeaterField(
  rows: RepeaterRow[],
  index: number,
  key: string,
  value: unknown,
): RepeaterRow[] {
  return rows.map((row, i) => (i === index ? { ...row, [key]: value } : row));
}

/** The JSON payload for the native form-post hidden input. */
export function serializeRepeaterRows(rows: RepeaterRow[]): string {
  return JSON.stringify(rows);
}

/**
 * The drivers' label overrides — every string the repeater renders itself,
 * in one record (the kit-wide `translations` seam; the repeater has no machine
 * behind it, so the record is entirely djui's). Both are plain strings: the
 * labels name controls, not values, so there is nothing to compute and nothing
 * to serialize around.
 */
export interface RepeaterTranslations {
  /** The add-row control's label (English default: "Add"). */
  add?: string;
  /** The per-row remove control's label (English default: "Remove row"). */
  removeRow?: string;
  /**
   * The per-row reorder handle's label (English default: "Reorder row"). The
   * handle is one control with three uses: drag it, press the arrow keys on
   * it, or click it and then another row's handle to place the row there.
   */
  reorderRow?: string;
  /**
   * The handle's description, read once on focus: the two non-drag ways of
   * reordering. English default: "Press the up and down arrow keys to move
   * the row, or select it and then another row's handle to place it there."
   */
  reorderHint?: string;
  /**
   * Announced when a handle is clicked without dragging — the row is now
   * selected and waiting for a destination. `{from}` is the 1-based position
   * and `{count}` the row total. English default: "Row {from} of {count}
   * selected. Choose another row's handle to place it there."
   */
  rowSelected?: string;
  /**
   * Announced after a reorder, to a live region. `{from}` and `{to}` are
   * 1-based positions and `{count}` the row total — a position is the only
   * useful thing to say, and it is what the drag library's own defaults omit
   * (they interpolate raw element ids instead). English default:
   * "Moved row {from} to position {to} of {count}".
   */
  rowMoved?: string;
}

/**
 * Fills the `{from}` / `{to}` / `{count}` placeholders of a reorder
 * announcement. Local to the repeater rather than the shared `fillTemplate`:
 * one three-key substitution does not justify widening that surface.
 */
export function fillRepeaterPositions(
  template: string,
  values: { from: number; to?: number; count: number }
): string {
  return template.replace(/\{(from|to|count)\}/g, (_, key: 'from' | 'to' | 'count') =>
    String(values[key] ?? '')
  );
}

/** Fills a `RepeaterTranslations` record out with the English defaults. */
export function resolveRepeaterTranslations(
  translations: RepeaterTranslations | undefined
): Required<RepeaterTranslations> {
  return {
    add: translations?.add ?? 'Add',
    removeRow: translations?.removeRow ?? 'Remove row',
    reorderRow: translations?.reorderRow ?? 'Reorder row',
    reorderHint:
      translations?.reorderHint ??
      "Press the up and down arrow keys to move the row, or select it and then another row's handle to place it there.",
    rowSelected:
      translations?.rowSelected ?? "Row {from} of {count} selected. Choose another row's handle to place it there.",
    rowMoved: translations?.rowMoved ?? 'Moved row {from} to position {to} of {count}',
  };
}

/**
 * Moves one row to another position, returning a new array; the rows between
 * shift by one to make room. The handle's non-drag reorder — an arrow key
 * moves by a step, a second click on another handle moves to that row's
 * position.
 *
 * Deliberately not the drag library's own `move` helper: that reconciles an
 * optimistic sort against a **drag event**, so it cannot serve a control that
 * was clicked. The two paths therefore converge on the driver's own commit
 * rather than on the library's.
 *
 * Returns the same array reference when either position is off the list or
 * they are the same, so a caller can skip a no-op commit.
 */
export function moveRepeaterRowTo<Item>(items: Item[], from: number, to: number): Item[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Moves one row by a single step — `moveRepeaterRowTo` with a neighbour as the target. */
export function moveRepeaterRow<Item>(items: Item[], index: number, step: -1 | 1): Item[] {
  return moveRepeaterRowTo(items, index, index + step);
}
