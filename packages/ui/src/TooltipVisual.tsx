import type { ReactNode, ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import { componentDefault } from './scripts';
import './TooltipVisual.scss';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

interface TooltipVisualProps extends ComponentPropsWithRef<'div'> {
  color?: `accent-${string}` | `context-${string}` | `foreground-${string}` | `surface-${string}` | 'backdrop';
  arrow?: boolean;
  arrowProps?: Record<string, unknown>;
  arrowTipProps?: Record<string, unknown>;
  elevation?: string;
  surface?: number;
  children?: ReactNode;
}

export function TooltipVisual(props: TooltipVisualProps) {
  const { color, arrow, arrowProps, arrowTipProps, elevation, surface, children, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiTooltip');

  return (
    <div
      {...rest}
      data-djui-next-surface=""
      data-djui-set-surface={surface ?? componentDefault('component-group-overlay', 'surface')}
      style={{ '--djui-component-tooltip--elevation-resolved': elevation ? 'var(--djui-shadow-' + elevation + ')' : undefined, '--djui-current-color-rgb': color !== undefined ? 'var(--djui-' + color + '-rgb)' : undefined, '--djui-current-color-contrast-rgb': color !== undefined ? 'var(--djui-' + color + '-contrast-rgb, var(--djui-foreground-contrast-rgb))' : undefined, '--djui-current-color-light-rgb': color !== undefined ? 'var(--djui-' + color + '-light-rgb)' : undefined, '--djui-current-color-lighter-rgb': color !== undefined ? 'var(--djui-' + color + '-lighter-rgb)' : undefined, '--djui-current-color-lightest-rgb': color !== undefined ? 'var(--djui-' + color + '-lightest-rgb)' : undefined, '--djui-current-color-dark-rgb': color !== undefined ? 'var(--djui-' + color + '-dark-rgb)' : undefined, '--djui-current-color-darker-rgb': color !== undefined ? 'var(--djui-' + color + '-darker-rgb)' : undefined, '--djui-current-color-darkest-rgb': color !== undefined ? 'var(--djui-' + color + '-darkest-rgb)' : undefined, '--djui-current-color-hover-rgb': color !== undefined ? 'var(--djui-' + color + '-hover-rgb)' : undefined, '--djui-current-color-active-rgb': color !== undefined ? 'var(--djui-' + color + '-active-rgb)' : undefined, ...style }}
      className={bem(undefined, { colored: color !== undefined }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      {arrow === true && (
        <div {...arrowProps} className="DjuiTooltip__arrow">
          <div {...arrowTipProps} className="DjuiTooltip__arrow-tip" />
        </div>
      )}
      <div className="DjuiTooltip__content">
        {props.children}
      </div>
    </div>
  );
}
