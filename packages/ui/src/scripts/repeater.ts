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
  /** The per-row move-up control's label (English default: "Move row up"). */
  moveRowUp?: string;
  /** The per-row move-down control's label (English default: "Move row down"). */
  moveRowDown?: string;
  /**
   * Announced after a reorder, to a live region. `{from}` and `{to}` are
   * 1-based positions and `{count}` the row total — a position is the only
   * useful thing to say, and it is what the drag library's own defaults omit
   * (they interpolate raw element ids instead). English default:
   * "Moved row {from} to position {to} of {count}".
   */
  rowMoved?: string;
}

/** Fills a `RepeaterTranslations` record out with the English defaults. */
export function resolveRepeaterTranslations(
  translations: RepeaterTranslations | undefined
): Required<RepeaterTranslations> {
  return {
    add: translations?.add ?? 'Add',
    removeRow: translations?.removeRow ?? 'Remove row',
    moveRowUp: translations?.moveRowUp ?? 'Move row up',
    moveRowDown: translations?.moveRowDown ?? 'Move row down',
    rowMoved: translations?.rowMoved ?? 'Moved row {from} to position {to} of {count}',
  };
}

/**
 * Moves one row by a single step, returning a new array. The button path's
 * reorder.
 *
 * Deliberately not the drag library's own `move` helper: that reconciles an
 * optimistic sort against a **drag event**, so it cannot serve a control that
 * was clicked. The two paths therefore converge on the driver's own commit
 * rather than on the library's.
 *
 * Returns the same array reference when the move would run off either end, so a
 * caller can skip a no-op commit.
 */
export function moveRepeaterRow<Item>(items: Item[], index: number, step: -1 | 1): Item[] {
  const target = index + step;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
