import type { ReactNode, ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
export interface RepeaterColumn {
  key: string;
  label?: string;
  width?: string;
}
import './RepeaterVisual.scss';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

interface RepeaterVisualProps extends ComponentPropsWithRef<'div'> {
  columns?: RepeaterColumn[];
  variant?: 'padded' | 'segmented';
  hideHeader?: boolean;
  sortable?: boolean;
  name?: string;
  serializedValue?: string;
  children?: ReactNode;
  addButton?: ReactNode;
}

export function RepeaterVisual(props: RepeaterVisualProps) {
  const { columns, variant, hideHeader, sortable, name, serializedValue, children, addButton, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiRepeater');

  return (
    <div
      {...rest}
      data-djui-next-surface=""
      style={style}
      className={bem(undefined, { segmented: variant === 'segmented' }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      <div
        className="DjuiRepeater__container"
        role="table"
        style={{ '--djui-component-repeater--columns': (sortable ? 'auto ' : '') + (columns && columns.length ? columns.map((column) => column.width || 'minmax(0, 1fr)').join(' ') : 'minmax(0, 1fr)') + ' auto' }}
      >
        {!hideHeader && columns && columns.length && (
          <div className="DjuiRepeater__head">
            <div className="DjuiRepeater__row" role="row">
              {sortable && (
                <div
                  className="DjuiRepeater__cell DjuiRepeater__cell--handle"
                  role="columnheader"
                />
              )}
              {columns.map((column) => (
                <div
                  key={column.key}
                  className="DjuiRepeater__cell"
                  role="columnheader"
                >
                  {column.label}
                </div>
              ))}
              <div
                className="DjuiRepeater__cell DjuiRepeater__cell--actions"
                role="columnheader"
              />
            </div>
          </div>
        )}
        <div className="DjuiRepeater__body">
          {props.children}
        </div>
        <div className="DjuiRepeater__add" role="row">
          <div className="DjuiRepeater__add-cell" role="cell">
            {props.addButton}
          </div>
        </div>
      </div>
      {name && <input type="hidden" name={name} value={serializedValue} />}
    </div>
  );
}
