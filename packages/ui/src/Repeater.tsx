'use client';

import { useRef, useState, type ReactNode } from 'react';
import { DragDropProvider, type DragEndEvent } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { move } from '@dnd-kit/helpers';
import { moveRepeaterRow } from './scripts';

// The announcement's placeholders, filled locally — the shared `fillTemplate`
// is not re-exported from `djui/scripts`, and one three-key substitution does
// not justify widening that surface.
const fillRowMovedTemplate = (
  template: string,
  values: { from: number; to: number; count: number }
) => template.replace(/\{(from|to|count)\}/g, (_, key: 'from' | 'to' | 'count') => String(values[key]));
import {
  addRepeaterRow,
  removeRepeaterRow,
  resolveRepeaterTranslations,
  serializeRepeaterRows,
  setRepeaterField,
  type RepeaterRow,
  type RepeaterTranslations,
} from './scripts';

import { RepeaterVisual, type RepeaterColumn } from './RepeaterVisual';
import { RepeaterRowVisual } from './RepeaterRowVisual';
import { Icon } from './Icon';

// `RepeaterColumn` is defined on `RepeaterVisual`, which the barrel exports by
// name (not with `export *`), so the type never reaches consumers through it.
// Re-export it here — the barrel's `export * from './Repeater'` surfaces it,
// giving the tabular `columns`/`renderCell` seam a public type.
export type { RepeaterRow, RepeaterColumn };

/**
 * `Repeater` (React) — the repeating-rows control's **behaviour**: the irreducible
 * runtime the generated `RepeaterVisual` / `RepeaterRowVisual` can't express,
 * composing them for all appearance (the Visual/driver split).
 * It owns the row list (uncontrolled by default, or controlled via
 * `value`/`onChange`), add/remove, optional drag-sort (dnd-kit), and the
 * JSON-serialized `value` mirrored into the Visual's hidden `<input name>` for
 * native form posting.
 *
 * It is a **control**, not a field: no label/error of its own — wrap it in
 * `<Field>` for those (the input/field split, as `TextInput`). Row *content* is
 * consumer-driven: the `renderRow` render-prop is the primitive (consistent with
 * Field's render-children), and `columns` + `renderCell` is the tabular sugar
 * that also drives the header + grid tracks. This is the seam `@djui/use-form-definition`
 * uses to feed its nested-field renderer through.
 */
export interface RepeaterProps {
  /** Controlled row list. */
  value?: RepeaterRow[];
  /** Initial rows for uncontrolled use. */
  defaultValue?: RepeaterRow[];
  /** Called with the next row list on any add / remove / edit / reorder. */
  onChange?: (rows: RepeaterRow[]) => void;
  /** Column headers + grid tracks. With `renderCell`, the tabular sugar path. */
  columns?: RepeaterColumn[];
  /**
   * Tabular sugar: render one cell for `column` in `row`; used when `columns` is
   * set.
   *
   * `controlProps` is the cell's naming record — spread it onto whatever control
   * the cell renders. A column header does *not* implicitly name a control in its
   * column (measured, not assumed), so an unspread cell control is announced
   * without one; the row and column context comes from the table structure
   * around it, which is why the record carries the column's name and not a
   * composed "Role, row 2". A column with no `label` falls back to its `key`,
   * on the same reasoning: a weak name beats none.
   */
  renderCell?: (
    column: RepeaterColumn,
    row: RepeaterRow,
    index: number,
    setField: (key: string, value: unknown) => void,
    controlProps: { 'aria-label': string },
  ) => ReactNode;
  /** Render-prop primitive: the whole row's content (used when no `columns`/`renderCell`). */
  renderRow?: (
    row: RepeaterRow,
    index: number,
    setField: (key: string, value: unknown) => void,
  ) => ReactNode;
  /** The frame look: `'padded'` (default, flat list) or `'segmented'` (tabular separators). */
  variant?: 'padded' | 'segmented';
  /** Hide the header row (collapses toward the box-list look). */
  hideHeader?: boolean;
  /** Enable drag-to-reorder (dnd-kit). */
  sortable?: boolean;
  /**
   * Every string the repeater renders itself — the add control's label and the
   * per-row remove control's — in one record (English defaults: "Add" /
   * "Remove row").
   */
  translations?: RepeaterTranslations;
  /** Replace the per-row remove control (fills the row Visual's `removeButton` slot). */
  renderRemoveButton?: (remove: () => void, index: number) => ReactNode;
  /** Replace the add control (fills the shell Visual's `addButton` slot). */
  renderAddButton?: (add: () => void) => ReactNode;
  /** Hide the add control. */
  hideAddRow?: boolean;
  /** Hide the per-row remove control. */
  hideRemoveRow?: boolean;
  /** Cap the number of rows (the add control hides at the cap). */
  maxRows?: number;
  /** Native form-post name; when set, the value rides a hidden `<input>` as JSON. */
  name?: string;
  /** Extra class merged onto the control root. */
  className?: string;
}

let rowIdCounter = 0;
const nextRowId = () => `djui-repeater-row-${rowIdCounter++}`;

export function Repeater({
  value: controlledValue,
  defaultValue = [],
  onChange,
  columns,
  renderCell,
  renderRow,
  variant,
  hideHeader,
  sortable = false,
  translations,
  renderRemoveButton,
  renderAddButton,
  hideAddRow = false,
  hideRemoveRow = false,
  maxRows,
  name,
  className,
}: RepeaterProps) {
  const labels = resolveRepeaterTranslations(translations);
  const [announcement, setAnnouncement] = useState('');
  const isControlled = controlledValue !== undefined;
  const [internalRows, setInternalRows] = useState<RepeaterRow[]>(
    controlledValue ?? defaultValue,
  );
  const rows = isControlled ? controlledValue! : internalRows;

  // Stable per-row ids for React keys + dnd sorting, kept parallel to the rows
  // (the value itself stays clean — ids never leak into `onChange` or the JSON).
  const idsRef = useRef<string[]>(rows.map(nextRowId));
  if (idsRef.current.length !== rows.length) {
    const next = rows.map((_, i) => idsRef.current[i] ?? nextRowId());
    idsRef.current = next;
  }
  const ids = idsRef.current;

  const commit = (nextRows: RepeaterRow[], nextIds: string[]) => {
    idsRef.current = nextIds;
    if (!isControlled) setInternalRows(nextRows);
    onChange?.(nextRows);
  };

  const atMax = maxRows !== undefined && rows.length >= maxRows;

  const handleAdd = () => {
    if (hideAddRow || atMax) return;
    commit(addRepeaterRow(rows), [...ids, nextRowId()]);
  };

  const handleRemove = (index: number) => {
    if (hideRemoveRow) return;
    commit(removeRepeaterRow(rows, index), removeRepeaterRow(ids, index));
  };

  const handleFieldChange = (index: number, key: string, fieldValue: unknown) => {
    commit(setRepeaterField(rows, index, key, fieldValue), ids);
  };

  // Reorder by button — the non-drag path SC 2.5.7 requires. It cannot reuse
  // the drag library's `move`, which reconciles against a drag event, so both
  // paths converge on `commit` instead.
  const handleMove = (index: number, step: -1 | 1) => {
    const nextRows = moveRepeaterRow(rows, index, step);
    if (nextRows === rows) return;
    commit(nextRows, moveRepeaterRow(ids, index, step));
    setAnnouncement(
      fillRowMovedTemplate(labels.rowMoved, {
        from: index + 1,
        to: index + step + 1,
        count: rows.length,
      })
    );
  };

  // Reorder on drop: pair each stable id with its row so `move` (the dnd-kit helper
  // that reconciles the optimistic sort) can match the dragged/target ids, then split
  // the reordered pairs back into the parallel rows + ids the driver commits.
  const handleDragEnd = (event: DragEndEvent) => {
    const paired = ids.map((id, index) => ({ id, row: rows[index] }));
    const moved = move(paired, event);
    if (moved === paired) return;
    commit(
      moved.map((entry) => entry.row),
      moved.map((entry) => entry.id),
    );
  };

  const rowContent = (row: RepeaterRow, index: number): ReactNode => {
    const setField = (key: string, fieldValue: unknown) =>
      handleFieldChange(index, key, fieldValue);
    // Columns drive the cells; `renderCell` supplies each cell's content, falling
    // back to the row value as text when omitted (the display-only default, as the
    // Vue/Svelte drivers — a bare `columns`+`value` repeater renders across targets
    // without a render prop). Without `columns`, the whole row is one cell from
    // `renderRow`, defaulting to the row's values joined.
    if (columns && columns.length) {
      return columns.map((column) => (
        // `role="cell"`: the container is a `table`, and a table's rows own cells
        // — a control sitting directly in a row is a child the role does not
        // allow. The controls and remove cells beside these already carried it.
        <div key={column.key} role="cell" className="DjuiRepeater__cell">
          {renderCell
            ? renderCell(column, row, index, setField, {
                'aria-label': column.label ?? column.key,
              })
            : String(row[column.key] ?? '')}
        </div>
      ));
    }
    return (
      <div role="cell" className="DjuiRepeater__cell">
        {renderRow
          ? renderRow(row, index, setField)
          : Object.values(row)
              .map((value) => String(value ?? ''))
              .join(' ')}
      </div>
    );
  };

  const removeButton = (index: number) =>
    hideRemoveRow ? null : renderRemoveButton ? (
      renderRemoveButton(() => handleRemove(index), index)
    ) : (
      <button
        type="button"
        className="DjuiRepeater__control"
        onClick={() => handleRemove(index)}
        aria-label={labels.removeRow}
      >
        <Icon name="x" />
      </button>
    );

  const rowNodes = rows.map((row, index) =>
    sortable ? (
      <SortableRow
        key={ids[index]}
        id={ids[index]}
        index={index}
        isLast={index === rows.length - 1}
        labels={labels}
        onMoveUp={() => handleMove(index, -1)}
        onMoveDown={() => handleMove(index, 1)}
        removeButton={removeButton(index)}
      >
        {rowContent(row, index)}
      </SortableRow>
    ) : (
      <RepeaterRowVisual key={ids[index]} removeButton={removeButton(index)}>
        {rowContent(row, index)}
      </RepeaterRowVisual>
    ),
  );

  const shell = (
    <RepeaterVisual
      className={className}
      columns={columns}
      variant={variant}
      hideHeader={hideHeader}
      sortable={sortable}
      name={name}
      serializedValue={name ? serializeRepeaterRows(rows) : undefined}
      addButton={
        !hideAddRow && !atMax ? (
          renderAddButton ? (
            renderAddButton(handleAdd)
          ) : (
            <button
              type="button"
              className="DjuiRepeater__control"
              onClick={handleAdd}
              aria-label={labels.add}
            >
              <Icon name="plus" />
            </button>
          )
        ) : undefined
      }
    >
      {rowNodes}
    </RepeaterVisual>
  );

  // Always mount the DragDropProvider — inert until `sortable` registers a draggable —
  // so the wrapper is uniform across the React/Vue/Svelte drivers (provider-wrap
  // alignment; Vue/Svelte always-wrap, so React matches rather than they branch).
  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      {shell}
      {/*
        The reorder live region. Mounted empty and filled afterwards, because a
        region injected together with its text announces nothing (ARIA19) — and
        `polite` so a reorder never interrupts what the user is already hearing.
        It reports the POSITION, which is the only useful thing to say and the
        thing the drag library's own announcements omit: its defaults
        interpolate raw element ids ("Picked up draggable item
        djui-repeater-row-2").
      */}
      <span className="DjuiRepeater__announcement" role="status" aria-live="polite">
        {announcement}
      </span>
    </DragDropProvider>
  );
}

/**
 * One sortable row — a `RepeaterRowVisual` given the sortable's element `ref` (the
 * engine translates/animates it directly) and a `handleRef`-bearing drag grip in
 * the Visual's `handle` slot. `index` keeps the sortable's position current as the
 * list reorders. The drag-active styling (the lifted row's dim + its self-contained
 * grid) lives in the Visual's SCSS, keyed on dnd-kit's `data-dnd-dragging` hook, so
 * it stays uniform across every target rather than an inline per-framework style.
 */
function SortableRow({
  id,
  index,
  isLast,
  labels,
  onMoveUp,
  onMoveDown,
  removeButton,
  children,
}: {
  isLast: boolean;
  labels: Required<RepeaterTranslations>;
  onMoveUp: () => void;
  onMoveDown: () => void;
  id: string;
  index: number;
  removeButton: ReactNode;
  children: ReactNode;
}) {
  const { ref, handleRef } = useSortable({ id, index });
  return (
    <RepeaterRowVisual
      ref={ref}
      sortable
      removeButton={removeButton}
      handle={
        <>
          {/*
            The grip is a POINTER affordance only. It is `aria-hidden` because
            the two buttons beside it do the same job for every other input, and
            announcing a third control that only a mouse can use is noise. That
            also neutralises the drag library's `aria-pressed` / `aria-grabbed`,
            which it writes unconditionally as `String(isDragging)` — so at rest
            every grip otherwise announced as an unpressed toggle button, with a
            second attribute (`aria-grabbed`) that ARIA 1.2 removed.

            `tabIndex={-1}` finishes that decision. Hidden *and* focusable is a
            contradiction — a keyboard user would land on a control screen readers
            have been told is not there. dnd-kit only writes `tabindex="0"` when
            the activator has no `tabindex` of its own, so stating one here is a
            supported opt-out rather than a fight with the library.
          */}
          <span
            className="DjuiRepeater__control DjuiRepeater__grip"
            ref={handleRef}
            aria-hidden="true"
            tabIndex={-1}
          >
            <Icon name="grip-vertical" />
          </span>
          <button
            type="button"
            className="DjuiRepeater__control"
            aria-label={labels.moveRowUp}
            disabled={index === 0}
            onClick={() => onMoveUp()}
          >
            <Icon name="chevron-up" />
          </button>
          <button
            type="button"
            className="DjuiRepeater__control"
            aria-label={labels.moveRowDown}
            disabled={isLast}
            onClick={() => onMoveDown()}
          >
            <Icon name="chevron-down" />
          </button>
        </>
      }
    >
      {children}
    </RepeaterRowVisual>
  );
}
