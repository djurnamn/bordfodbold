import type { ReactNode, ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import { componentDefault } from './scripts';
import './DrawerVisual.scss';

interface DrawerVisualProps extends ComponentPropsWithRef<'div'> {
  side?: 'left' | 'right' | 'top' | 'bottom';
  surface?: number;
  closeButton?: ReactNode;
  children?: ReactNode;
}

export function DrawerVisual(props: DrawerVisualProps) {
  const { side, surface, closeButton, children, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiDrawer');

  return (
    <div
      {...rest}
      data-djui-next-surface=""
      data-djui-set-surface={surface ?? componentDefault('Drawer', 'surface') ?? componentDefault('component-group-overlay', 'surface')}
      style={style}
      className={bem(undefined, { 'side-top': side === 'top', 'side-bottom': side === 'bottom' }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      <div className="DjuiDrawer__close-button">
        {props.closeButton}
      </div>
      <div className="DjuiDrawer__inner">
        <div className="DjuiDrawer__content">
          {props.children}
        </div>
      </div>
    </div>
  );
}
