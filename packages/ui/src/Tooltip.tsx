import type { ReactNode } from 'react';
import type { Placement } from '@zag-js/tooltip';
import { TooltipDriver } from './TooltipDriver';
import { TooltipTrigger } from './TooltipTrigger';
import { TooltipVisual } from './TooltipVisual';
import { OverlayPanel } from './OverlayPanel';
import { overlaySurfaceForTrigger } from './scripts';

interface TooltipProps {
  color?: `accent-${string}` | `context-${string}` | `foreground-${string}` | `surface-${string}` | 'backdrop';
  placement?: Placement;
  openDelay?: number;
  closeDelay?: number;
  inline?: boolean;
  interactive?: boolean;
  arrow?: boolean;
  gutter?: number;
  elevation?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  surface?: number;
  trigger?: ReactNode;
  children?: ReactNode;
}

export function Tooltip(props: TooltipProps) {
  const { color, placement, openDelay, closeDelay, inline, interactive = false, arrow, gutter, elevation, defaultOpen, open, onOpenChange, surface } = props;

  return (
    <TooltipDriver
      placement={placement}
      gutter={gutter}
      openDelay={openDelay}
      closeDelay={closeDelay}
      interactive={interactive}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      {({ api }) => (
        <>
          <TooltipTrigger {...api.getTriggerProps()} inline={inline}>
            {props.trigger}
          </TooltipTrigger>
          {api.open && (
            <OverlayPanel positionerProps={api.getPositionerProps()}>
              <TooltipVisual
                {...api.getContentProps()}
                color={color}
                arrow={arrow ?? true}
                arrowProps={(arrow ?? true) ? api.getArrowProps() : undefined}
                arrowTipProps={(arrow ?? true) ? api.getArrowTipProps() : undefined}
                elevation={elevation}
                surface={surface ?? overlaySurfaceForTrigger(api.getTriggerProps().id)}
              >
                {props.children}
              </TooltipVisual>
            </OverlayPanel>
          )}
        </>
      )}
    </TooltipDriver>
  );
}
