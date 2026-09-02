import type { ReactNode } from 'react';
import { useBem } from 'use-bem/react';
import './DrawerRoot.scss';

interface DrawerRootProps {
  backdropProps: Record<string, unknown>;
  positionerProps: Record<string, unknown>;
  side?: 'left' | 'right' | 'top' | 'bottom';
  contained?: boolean;
  children?: ReactNode;
}

export function DrawerRoot(props: DrawerRootProps) {
  const { backdropProps, positionerProps, side, contained } = props;

  const bem = useBem('DjuiDrawerRoot');

  return (
    <div
      className={bem(undefined, { 'side-right': side === 'right', 'side-top': side === 'top', 'side-bottom': side === 'bottom', contained: contained })}
    >
      <div {...backdropProps} className="DjuiDrawerRoot__backdrop" />
      <div {...positionerProps} className="DjuiDrawerRoot__positioner">
        {props.children}
      </div>
    </div>
  );
}
