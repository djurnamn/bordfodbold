import type { ReactNode, ComponentPropsWithRef } from 'react';

interface TabListVisualProps extends ComponentPropsWithRef<'div'> {
  listProps?: Record<string, unknown>;
  children?: ReactNode;
}

export function TabListVisual(props: TabListVisualProps) {
  const { listProps, children, className, style, ref, ...rest } = props;

  return (
    <div
      {...rest}
      className={'DjuiTabs__header' + (className ? ' ' + className : '')}
      style={style}
      ref={ref}
    >
      <div {...listProps} className="DjuiTabs__tabs">
        {props.children}
      </div>
    </div>
  );
}
