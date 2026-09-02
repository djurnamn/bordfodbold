import type { ReactNode } from 'react';
import { Portal } from '@zag-js/react';

interface OverlayPanelProps {
  positionerProps: Record<string, unknown>;
  children?: ReactNode;
}

export function OverlayPanel(props: OverlayPanelProps) {
  const { positionerProps } = props;

  return (
    <Portal>
      <div {...positionerProps}>
        {props.children}
      </div>
    </Portal>
  );
}
