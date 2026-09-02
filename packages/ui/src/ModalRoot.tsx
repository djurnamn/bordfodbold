import type { ReactNode } from 'react';
import { useBem } from 'use-bem/react';
import { componentDefault } from './scripts';
import './ModalRoot.scss';

interface ModalRootProps {
  backdropProps: Record<string, unknown>;
  positionerProps: Record<string, unknown>;
  placement?: 'top' | 'center';
  children?: ReactNode;
}

export function ModalRoot(props: ModalRootProps) {
  const { backdropProps, positionerProps, placement } = props;

  const bem = useBem('DjuiModalRoot');

  return (
    <div
      className={bem(undefined, { 'placement-center': (placement ?? componentDefault('Modal', 'placement')) === 'center' })}
    >
      <div {...backdropProps} className="DjuiModalRoot__overlay" />
      <div {...positionerProps} className="DjuiModalRoot__positioner">
        {props.children}
      </div>
    </div>
  );
}
