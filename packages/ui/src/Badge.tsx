import type { ReactNode, ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import './Badge.scss';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

interface BadgeProps extends ComponentPropsWithRef<'span'> {
  color?: `accent-${string}` | `context-${string}` | `foreground-${string}` | `surface-${string}` | 'backdrop';
  size?: number;
  variant?: 'soft' | 'solid';
  hatched?: boolean;
  children?: ReactNode;
}

export function Badge(props: BadgeProps) {
  const { color, size, variant = 'soft', hatched, children, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiBadge');

  return (
    <span
      {...rest}
      style={{ '--djui-component-badge--size': size !== undefined ? size + 'rem' : undefined, '--djui-current-color-rgb': color !== undefined ? 'var(--djui-' + color + '-rgb)' : undefined, '--djui-current-color-contrast-rgb': color !== undefined ? 'var(--djui-' + color + '-contrast-rgb, var(--djui-foreground-contrast-rgb))' : undefined, '--djui-current-color-light-rgb': color !== undefined ? 'var(--djui-' + color + '-light-rgb)' : undefined, '--djui-current-color-lighter-rgb': color !== undefined ? 'var(--djui-' + color + '-lighter-rgb)' : undefined, '--djui-current-color-lightest-rgb': color !== undefined ? 'var(--djui-' + color + '-lightest-rgb)' : undefined, '--djui-current-color-dark-rgb': color !== undefined ? 'var(--djui-' + color + '-dark-rgb)' : undefined, '--djui-current-color-darker-rgb': color !== undefined ? 'var(--djui-' + color + '-darker-rgb)' : undefined, '--djui-current-color-darkest-rgb': color !== undefined ? 'var(--djui-' + color + '-darkest-rgb)' : undefined, '--djui-current-color-hover-rgb': color !== undefined ? 'var(--djui-' + color + '-hover-rgb)' : undefined, '--djui-current-color-active-rgb': color !== undefined ? 'var(--djui-' + color + '-active-rgb)' : undefined, ...style }}
      className={bem(undefined, { soft: variant === 'soft', solid: variant === 'solid', colored: color !== undefined, hatched: hatched === true }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      {props.children}
    </span>
  );
}
