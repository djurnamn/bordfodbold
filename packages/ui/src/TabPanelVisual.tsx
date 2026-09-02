import type { ReactNode, ComponentPropsWithRef } from 'react';

interface TabPanelVisualProps extends ComponentPropsWithRef<'div'> {
  surfaceShift?: boolean;
  standalone?: boolean;
  surfaceDirection?: 'next' | 'previous' | 'current';
  children?: ReactNode;
}

export function TabPanelVisual(props: TabPanelVisualProps) {
  const { surfaceShift, standalone, surfaceDirection, children, className, style, ref, ...rest } = props;

  return (
    <div
      {...rest}
      className={'DjuiTabs__content' + (standalone === true ? ' DjuiTabs__content--standalone' : '') + (surfaceDirection === 'previous' ? ' DjuiTabs__content--surface-previous' : '') + (surfaceDirection === 'current' ? ' DjuiTabs__content--surface-current' : '') + (className ? ' ' + className : '')}
      data-djui-next-surface={surfaceShift ? '' : undefined}
      style={style}
      ref={ref}
    >
      {props.children}
    </div>
  );
}
