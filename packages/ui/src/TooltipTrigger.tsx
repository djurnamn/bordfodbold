import type { ReactNode, ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import './TooltipTrigger.scss';

interface TooltipTriggerProps extends ComponentPropsWithRef<'span'> {
  inline?: boolean;
  children?: ReactNode;
}

export function TooltipTrigger(props: TooltipTriggerProps) {
  const { inline, children, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiTooltipTrigger');

  return (
    <span
      {...rest}
      style={style}
      className={bem(undefined, { inline: inline === true }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      {props.children}
    </span>
  );
}
