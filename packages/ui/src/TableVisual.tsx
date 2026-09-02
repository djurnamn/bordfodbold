import type { ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import type { ReactNode } from 'react'
export type SortDirection = "asc" | "desc";
export type ColumnWidth = {
  min?: number;
  max?: number;
  fill?: boolean;
  fixed?: number;
};
export type TableRow = Record<string, ReactNode>;
export type RowClickEvent = Pick<MouseEvent, 'button' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'defaultPrevented' | 'target'>;
export interface TableColumn {
  key: string;
  label: string;
  width?: ColumnWidth;
  sortable?: boolean;
  padded?: boolean;
  render?: (row: TableRow) => ReactNode;
  /** Where the column sits: "start" (default) or "end", for numbers. */
  align?: "start" | "center" | "end";
}
export type SortIcon = (direction: SortDirection) => ReactNode;
import { componentDefaultRecord } from './scripts';
import './TableVisual.scss';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

interface TableVisualProps extends ComponentPropsWithRef<'div'> {
  columns: TableColumn[];
  rows: TableRow[];
  hideHeader?: boolean;
  sortedColumn?: string | null;
  sortDirection?: SortDirection | null;
  sortIcon?: SortIcon;
  nonInteractive?: boolean;
  onSortColumn?: (key: string) => void;
  rowHref?: (row: TableRow) => string | undefined;
  linkColumn?: string;
  onRowClick?: (row: TableRow, event: RowClickEvent) => void;
  hover?: 'row' | 'cell' | 'none';
  headerCellProps?: Record<string, unknown>;
  bodyCellProps?: Record<string, unknown>;
  striped?: boolean;
  separators?: 'both' | 'rows' | 'columns' | 'none';
}

export function TableVisual(props: TableVisualProps) {
  const { columns, rows, hideHeader, sortedColumn, sortDirection, sortIcon, nonInteractive, onSortColumn, rowHref, linkColumn, onRowClick, hover, headerCellProps, bodyCellProps, striped, separators, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiTable');

  return (
    <div
      {...rest}
      data-djui-next-surface=""
      style={style}
      className={bem(undefined, { interactive: !nonInteractive, 'hover-row': (hover ?? ((rowHref || onRowClick) ? 'row' : 'none')) === 'row', 'hover-cell': (hover ?? ((rowHref || onRowClick) ? 'row' : 'none')) === 'cell', striped: striped === true, headless: hideHeader === true, 'separators-rows': separators === 'rows', 'separators-columns': separators === 'columns', 'separators-none': separators === 'none' }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      <div className="DjuiTable__scroll">
        <div
          className="DjuiTable__container"
          role="table"
          style={{ '--djui-component-table--columns': columns.map((column) => !column.width ? 'auto' : column.width.fixed ? column.width.fixed + 'px' : column.width.fill ? 'minmax(' + (column.width.min || 0) + 'px, 1fr)' : 'minmax(' + (column.width.min || 0) + 'px, ' + (column.width.max ? column.width.max + 'px' : 'auto') + ')').join(' ') }}
        >
          {!hideHeader && (
            <div className="DjuiTable__head">
              <div className="DjuiTable__row" role="row">
                {columns.map((column) => (
                  <div
                    key={column.key}
                    {...{ ...componentDefaultRecord('Table', 'headerCellProps'), ...headerCellProps }}
                    className="DjuiTable__cell"
                    role="columnheader"
                    aria-sort={column.sortable ? (sortedColumn === column.key && sortDirection ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
                  >
                    {nonInteractive ? (
                      <div
                        className={'DjuiTable__label' + (!column.sortable ? ' DjuiTable__label--unsortable' : '') + (column.align === 'end' ? ' DjuiTable__label--align-end' : '') + (column.align === 'center' ? ' DjuiTable__label--align-center' : '')}
                      >
                        {column.label}
                        {column.sortable && sortedColumn === column.key && sortDirection && sortIcon && (
                          sortIcon(sortDirection)
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={'DjuiTable__label' + (!column.sortable ? ' DjuiTable__label--unsortable' : '') + (column.align === 'end' ? ' DjuiTable__label--align-end' : '') + (column.align === 'center' ? ' DjuiTable__label--align-center' : '')}
                        disabled={!column.sortable}
                        onClick={() => column.sortable && onSortColumn?.(column.key)}
                      >
                        {column.label}
                        {column.sortable && sortedColumn === column.key && sortDirection && sortIcon && (
                          sortIcon(sortDirection)
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="DjuiTable__body">
            {rows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={'DjuiTable__row' + (rowHref && rowHref(row) ? ' DjuiTable__row--linkable' : '')}
                role="row"
                onClick={(event) => onRowClick?.(row, event)}
              >
                {columns.map((column) => (
                  <div
                    key={column.key}
                    {...{ ...componentDefaultRecord('Table', 'bodyCellProps'), ...bodyCellProps }}
                    className={'DjuiTable__cell' + (column.padded !== false ? ' DjuiTable__cell--padded' : '') + (column.align === 'end' ? ' DjuiTable__cell--align-end' : '') + (column.align === 'center' ? ' DjuiTable__cell--align-center' : '')}
                    role="cell"
                    data-djui-next-surface=""
                  >
                    {rowHref && rowHref(row) && column.key === (linkColumn ?? columns[0].key) ? (
                      <a className="DjuiTable__row-link" href={rowHref(row)}>
                        {column.render ? column.render(row) : row[column.key]}
                      </a>
                    ) : (
                      column.render ? column.render(row) : row[column.key]
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
