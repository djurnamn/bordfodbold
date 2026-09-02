import type { ReactNode, ComponentPropsWithRef } from 'react';

interface RepeaterRowVisualProps extends ComponentPropsWithRef<'div'> {
  sortable?: boolean;
  handle?: ReactNode;
  children?: ReactNode;
  removeButton?: ReactNode;
}

export function RepeaterRowVisual(props: RepeaterRowVisualProps) {
  const { sortable, handle, children, removeButton, className, style, ref, ...rest } = props;

  return (
    <div
      {...rest}
      className={'DjuiRepeater__row' + (sortable ? ' DjuiRepeater__row--sortable' : '') + (className ? ' ' + className : '')}
      role="row"
      style={style}
      ref={ref}
    >
      {sortable && (
        <div
          className="DjuiRepeater__cell DjuiRepeater__cell--handle"
          role="cell"
        >
          {props.handle}
        </div>
      )}
      {props.children}
      <div
        className="DjuiRepeater__cell DjuiRepeater__cell--actions"
        role="cell"
      >
        {props.removeButton}
      </div>
    </div>
  );
}
