import type { ReactNode, ComponentPropsWithRef } from 'react';

interface TabVisualProps extends ComponentPropsWithRef<'button'> {
  active?: boolean;
  surfaceShift?: boolean;
  children?: ReactNode;
}

export function TabVisual(props: TabVisualProps) {
  const { active, surfaceShift, children, className, style, ref, ...rest } = props;

  return (
    <button
      {...rest}
      type="button"
      className={'DjuiTabs__tab' + (active === true ? ' DjuiTabs__tab--active' : '') + (className ? ' ' + className : '')}
      data-djui-next-surface={surfaceShift ? '' : undefined}
      style={style}
      ref={ref}
    >
      {props.children}
    </button>
  );
}
