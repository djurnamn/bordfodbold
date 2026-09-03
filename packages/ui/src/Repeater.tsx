'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { DragDropProvider, PointerSensor, type DragEndEvent } from '@dnd-kit/react';
import { Accessibility, PointerActivationConstraints, defaultPreset } from '@dnd-kit/dom';
import { useSortable } from '@dnd-kit/react/sortable';
import { move } from '@dnd-kit/helpers';
import {
  addRepeaterRow,
  fillRepeaterPositions,
  moveRepeaterRowTo,
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

// The drag engine runs with its pointer sensor only, and without its
// accessibility plugin. The handle is a real button now, and the driver owns
// what it says: the plugin would write `aria-pressed` onto it unconditionally
// (as `String(isDragging)`, over the selected state the driver sets), and the
// keyboard sensor would start a keyboard drag on the same Space and Enter that
// select the row. The handle carries its own name, description and live region.
const dragPlugins = defaultPreset.plugins.filter((plugin) => plugin !== Accessibility);
// The engine's defaults start a mouse drag on the handle the moment it is
// pressed, which would swallow the click the handle now listens for. A drag
// is a small travel (or, on touch, a held press so a tap and a scroll stay
// what they are); anything less remains a click.
const dragSensors = [
  PointerSensor.configure({
    activationConstraints: (event) =>
      event.pointerType === 'touch'
        ? [new PointerActivationConstraints.Delay({ value: 250, tolerance: 5 })]
        : [new PointerActivationConstraints.Distance({ value: 4 })],
  }),
];

/**
 * `Repeater` (React) — the repeating-rows control's **behaviour**: the irreducible
 * runtime the generated `RepeaterVisual` / `RepeaterRowVisual` can't express,
 * composing them for all appearance (the Visual/driver split).
 * It owns the row list (uncontrolled by default, or controlled via
 * `value`/`onChange`), add/remove, optional reorder (drag through dnd-kit, and
 * the handle's two non-drag paths), and the JSON-serialized `value` mirrored
 * into the Visual's hidden `<input name>` for native form posting.
 *
 * It is a **control**, not a field: no label/error of its own — wrap it in
 * `<Field>` for those (the input/field split, as `TextInput`). Row *content* is
 * consumer-driven: the `renderRow` render-prop is the primitive (consistent with
 * Field's render-children), and `columns` + `renderCell` is the tabular sugar
 * that also drives the header + grid tracks. This is the seam `@djui/use-form-definition`
 * uses to feed its nested-field renderer through.
 *
 * **Reordering is one control with three uses.** The handle drags; the up and
 * down arrow keys move its row a step; and a click that is not a drag selects
 * the row, so a click on another row's handle places it there (a second click
 * on the same handle, or Escape, lets it go). The click path is the
 * single-pointer alternative WCAG 2.2 SC 2.5.7 requires — a keyboard
 * equivalent alone does not satisfy it — folded into the handle rather than
 * two more buttons beside it.
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
  /** Hide the header row (collapses toward the box-list look). */
  hideHeader?: boolean;
  /** Enable reordering: drag, the arrow keys, or click-and-place on the handle. */
  sortable?: boolean;
  /**
   * Every string the repeater renders itself — the add control's label, the
   * per-row remove and reorder controls', the reorder announcements — in one
   * record (English defaults).
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
  const hintId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState('');
  // The row a handle click picked up, waiting for a destination.
  const [selected, setSelected] = useState<number | null>(null);
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

  // Every change goes through here. A selection rarely survives one — the row
  // it named may have moved or gone — so the caller says which row, if any,
  // is selected afterwards.
  const commit = (
    nextRows: RepeaterRow[],
    nextIds: string[],
    nextSelected: number | null = null,
  ) => {
    idsRef.current = nextIds;
    if (!isControlled) setInternalRows(nextRows);
    setSelected(nextSelected);
    onChange?.(nextRows);
  };

  const atMax = maxRows !== undefined && rows.length >= maxRows;
  const showAdd = !hideAddRow && !atMax;

  // A selected row is released by a press anywhere that is not one of this
  // repeater's handles — a handle press is the placement (or the release) the
  // click handler owns. Captured on the document so it runs before anything
  // the press lands on.
  useEffect(() => {
    if (selected === null) return;
    const release = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target && root.current?.contains(target) && target.closest('.DjuiRepeater__grip')) return;
      setSelected(null);
    };
    document.addEventListener('pointerdown', release, true);
    return () => document.removeEventListener('pointerdown', release, true);
  }, [selected]);

  const handleAdd = () => {
    if (!showAdd) return;
    commit(addRepeaterRow(rows), [...ids, nextRowId()]);
  };

  const handleRemove = (index: number) => {
    if (hideRemoveRow) return;
    commit(removeRepeaterRow(rows, index), removeRepeaterRow(ids, index));
  };

  const handleFieldChange = (index: number, key: string, fieldValue: unknown) => {
    commit(setRepeaterField(rows, index, key, fieldValue), ids, selected);
  };

  // The non-drag reorder — the arrow keys and the click-and-place path. It
  // cannot reuse the drag library's `move`, which reconciles against a drag
  // event, so both paths converge on `commit` instead.
  const reorder = (from: number, to: number, nextSelected: number | null = null) => {
    const nextRows = moveRepeaterRowTo(rows, from, to);
    if (nextRows === rows) return;
    commit(nextRows, moveRepeaterRowTo(ids, from, to), nextSelected);
    setAnnouncement(
      fillRepeaterPositions(labels.rowMoved, { from: from + 1, to: to + 1, count: rows.length }),
    );
  };

  // A handle clicked without dragging: the first click selects its row, a
  // click on another row's handle places the selected row there, a second
  // click on the same handle lets it go.
  const handleSelect = (index: number) => {
    if (selected === null) {
      setSelected(index);
      setAnnouncement(
        fillRepeaterPositions(labels.rowSelected, { from: index + 1, count: rows.length }),
      );
      return;
    }
    if (selected === index) {
      setSelected(null);
      return;
    }
    reorder(selected, index);
  };

  const handleHandleKeyDown = (index: number, event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
    if (step !== 0) {
      event.preventDefault();
      // A selected row stays selected as it moves; any other row moving would
      // leave the index naming the wrong row, so that lets the selection go.
      reorder(index, index + step, selected === index ? index + step : null);
      // The keyed row is moved in the DOM, and a moved node loses focus. Put
      // it back on the same handle once the frame has painted the new order.
      const handle = event.currentTarget;
      requestAnimationFrame(() => handle.focus());
      return;
    }
    if (event.key === 'Escape' && selected !== null) {
      event.preventDefault();
      setSelected(null);
    }
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
        <div
          key={column.key}
          role="cell"
          className="DjuiRepeater__cell DjuiRepeater__cell--content"
        >
          {renderCell
            ? renderCell(column, row, index, setField, {
                'aria-label': column.label ?? column.key,
              })
            : String(row[column.key] ?? '')}
        </div>
      ));
    }
    return (
      <div role="cell" className="DjuiRepeater__cell DjuiRepeater__cell--content">
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
        selected={selected === index}
        label={labels.reorderRow}
        hintId={hintId}
        onSelect={() => handleSelect(index)}
        onKeyDown={(event) => handleHandleKeyDown(index, event)}
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
      ref={root}
      className={className}
      columns={columns}
      hideHeader={hideHeader}
      sortable={sortable}
      hideAddRow={!showAdd}
      name={name}
      serializedValue={name ? serializeRepeaterRows(rows) : undefined}
      addButton={
        showAdd ? (
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
    <DragDropProvider plugins={dragPlugins} sensors={dragSensors} onDragEnd={handleDragEnd}>
      {shell}
      {/*
        The handle's description — the two non-drag ways to reorder — read once
        on focus through `aria-describedby`, so a keyboard user learns the keys
        from the control itself.
      */}
      {sortable && (
        <span id={hintId} className="DjuiRepeater__announcement">
          {labels.reorderHint}
        </span>
      )}
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
 * engine translates/animates it directly) and a `handleRef`-bearing reorder handle
 * in the Visual's `handle` slot. `index` keeps the sortable's position current as
 * the list reorders. The drag-active styling (the lifted row's dim + its
 * self-contained grid) lives in the Visual's SCSS, keyed on dnd-kit's
 * `data-dnd-dragging` hook, so it stays uniform across every target rather than
 * an inline per-framework style.
 */
function SortableRow({
  id,
  index,
  selected,
  label,
  hintId,
  onSelect,
  onKeyDown,
  removeButton,
  children,
}: {
  id: string;
  index: number;
  selected: boolean;
  label: string;
  hintId: string;
  onSelect: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  removeButton: ReactNode;
  children: ReactNode;
}) {
  const { ref, handleRef } = useSortable({ id, index });
  return (
    <RepeaterRowVisual
      ref={ref}
      sortable
      selected={selected}
      removeButton={removeButton}
      handle={
        // The handle is a real, named button — the one reorder control. It
        // drags (dnd-kit's activator), takes the arrow keys, and toggles the
        // row's selection on a click that never became a drag; `aria-pressed`
        // is that selection. A plain click stays a click because the pointer
        // sensor activates only after a small travel or a held press.
        <button
          type="button"
          className="DjuiRepeater__control DjuiRepeater__grip"
          ref={handleRef}
          aria-label={label}
          aria-describedby={hintId}
          aria-pressed={selected}
          onClick={onSelect}
          onKeyDown={onKeyDown}
        >
          <Icon name="grip-vertical" />
        </button>
      }
    >
      {children}
    </RepeaterRowVisual>
  );
}
