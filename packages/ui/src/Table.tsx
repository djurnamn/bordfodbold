'use client';

import { useState, type ReactNode } from 'react';
import { followRowLink, nextSort, resolveRowHref, type RowClickEvent, type SortDirection } from './scripts';
import { TableVisual, type TableColumn, type TableRow } from './TableVisual';

/**
 * `Table` (React) — the sortable grid's **behaviour**: the irreducible runtime
 * the generated `TableVisual` can't express, composing it for all appearance
 * (the Visual/driver split). It owns only the sort-cycle state —
 * the `asc → desc → null` cycle — *uncontrolled* by default, with a
 * controlled override (`sortedColumn`/`sortDirection` + `onSort`), exactly as
 * DashboardTemplate owns the uncontrolled drawer toggle.
 *
 * A header click advances the cycle for that column: a fresh column starts at
 * `asc`; the active column steps `asc → desc → null` (clearing the sort). When a
 * consumer passes `onSort` the cycle is reported and not self-applied (controlled);
 * otherwise the driver keeps the state. The inert twin (`nonInteractive`)
 * renders the look-alike `<div>` headers and wires no click.
 */
export interface TableProps {
  /** Column definitions — order, labels, sortability, width, custom cell render. */
  columns: TableColumn[];
  /** Row records; each cell reads `row[column.key]` (or `column.render`). */
  rows: TableRow[];
  /** Hide the header row. */
  hideHeader?: boolean;
  /** Controlled: the sorted column's `key` (`null` = unsorted). */
  sortedColumn?: string | null;
  /** Controlled: the sort direction (`null` = unsorted). */
  sortDirection?: SortDirection | null;
  /** Initial sorted column for uncontrolled use. */
  defaultSortedColumn?: string | null;
  /** Initial sort direction for uncontrolled use. */
  defaultSortDirection?: SortDirection | null;
  /** Rendered beside the active sorted column's label. */
  sortIcon?: (direction: SortDirection) => ReactNode;
  /** The inert look-alike — headers are `<div>`s and sorting is controlled. */
  nonInteractive?: boolean;
  /** Controlled sort callback; when given, the driver reports rather than stores. */
  onSort?: (column: string | null, direction: SortDirection | null) => void;
  /**
   * Per-row link target. A row whose `rowHref` returns a string gets a real
   * link in its link cell (the row's accessible name) and follows the same
   * href for a plain click anywhere else on the row.
   */
  rowHref?: (row: TableRow) => string | undefined;
  /**
   * Serializable row-link variant: the name of the row field carrying the
   * target URL (e.g. `"href"`). A server component can pass this plain string
   * where a function could not cross the server→client boundary; `rowHref`
   * wins when both are given.
   */
  rowHrefKey?: string;
  /** The column whose cell carries the row link; defaults to the first column. */
  linkColumn?: string;
  /** Row click for JavaScript navigation — receives the row record. */
  onRowClick?: (row: TableRow) => void;
  /** Hover affordance: `'row'`, `'cell'`, or `'none'` (defaults to `'row'` when linkable). */
  hover?: 'row' | 'cell' | 'none';
  /** Attributes spread onto every header cell (e.g. `{ ...setSurface(2) }`). */
  headerCellProps?: Record<string, unknown>;
  /** Attributes spread onto every body cell (e.g. `{ ...setSurface(3) }`). */
  bodyCellProps?: Record<string, unknown>;
  /** Alternate the body rows' fill; usually paired with `separators: 'none'`. */
  striped?: boolean;
  /** Which separator gaps the surface shows (default `'both'`). */
  separators?: 'both' | 'rows' | 'columns' | 'none';
  /** Extra class merged onto the grid root. */
  className?: string;
}

export function Table({
  columns,
  rows,
  hideHeader,
  sortedColumn: externalSortedColumn,
  sortDirection: externalSortDirection,
  defaultSortedColumn = null,
  defaultSortDirection = null,
  sortIcon,
  nonInteractive,
  onSort,
  rowHref,
  rowHrefKey,
  linkColumn,
  onRowClick,
  hover,
  headerCellProps,
  bodyCellProps,
  striped,
  separators,
  className,
}: TableProps) {
  // Uncontrolled state seeds from the `default*` props only — the controlled
  // props never seed (the `value`/`defaultValue` split, as Tabs/Repeater).
  const [internalSortedColumn, setInternalSortedColumn] = useState<string | null>(
    defaultSortedColumn
  );
  const [internalSortDirection, setInternalSortDirection] = useState<SortDirection | null>(
    defaultSortDirection
  );

  const sortedColumn =
    externalSortedColumn !== undefined ? externalSortedColumn : internalSortedColumn;
  const sortDirection =
    externalSortDirection !== undefined ? externalSortDirection : internalSortDirection;

  const handleSort = (key: string) => {
    const { column, direction } = nextSort(key, sortedColumn, sortDirection);
    if (onSort) {
      onSort(column, direction);
    } else {
      setInternalSortedColumn(column);
      setInternalSortDirection(direction);
    }
  };

  const resolvedRowHref = resolveRowHref(rowHref, rowHrefKey);
  // The row's click: the consumer's handler, then the link's href for a plain
  // click off the link cell. Wired only when the row IS interactive, so the
  // Visual's hover default still reads the intent off the props.
  const handleRowClick =
    resolvedRowHref || onRowClick
      ? (row: TableRow, event: RowClickEvent) => {
          onRowClick?.(row);
          followRowLink(event, resolvedRowHref?.(row));
        }
      : undefined;

  return (
    <TableVisual
      className={className}
      columns={columns}
      rows={rows}
      hideHeader={hideHeader}
      nonInteractive={nonInteractive}
      sortedColumn={sortedColumn}
      sortDirection={sortDirection}
      sortIcon={sortIcon}
      rowHref={resolvedRowHref}
      linkColumn={linkColumn}
      onRowClick={handleRowClick}
      hover={hover}
      headerCellProps={headerCellProps}
      bodyCellProps={bodyCellProps}
      striped={striped}
      separators={separators}
      onSortColumn={nonInteractive ? undefined : handleSort}
    />
  );
}