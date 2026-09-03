import type { ReactNode, ComponentPropsWithRef } from 'react';

interface RepeaterRowVisualProps extends ComponentPropsWithRef<'div'> {
  sortable?: boolean;
  selected?: boolean;
  handle?: ReactNode;
  children?: ReactNode;
  removeButton?: ReactNode;
}

export function RepeaterRowVisual(props: RepeaterRowVisualProps) {
  const { sortable, selected, handle, children, removeButton, className, style, ref, ...rest } = props;

  return (
    <div
      {...rest}
      className={'DjuiRepeater__row' + (sortable ? ' DjuiRepeater__row--sortable' : '') + (selected ? ' DjuiRepeater__row--selected' : '') + (className ? ' ' + className : '')}
      role="row"
      style={style}
      ref={ref}
    >
      <div
        className="DjuiRepeater__cell DjuiRepeater__cell--handle"
        role="cell"
      >
        {props.handle}
      </div>
      <div className="DjuiRepeater__cells" role="presentation">
        {props.children}
      </div>
      <div
        className="DjuiRepeater__cell DjuiRepeater__cell--actions"
        role="cell"
      >
        {props.removeButton}
      </div>
    </div>
  );
}
