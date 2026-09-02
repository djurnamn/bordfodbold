import type { ReactNode, ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import { componentDefault } from './scripts';
import './TabsVisual.scss';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

interface TabsVisualProps extends ComponentPropsWithRef<'div'> {
  variant?: 'soft' | 'solid';
  color?: `accent-${string}` | `context-${string}` | `foreground-${string}` | `surface-${string}` | 'backdrop';
  theme?: 'folder' | 'none';
  surfaceDirection?: 'next' | 'previous';
  size?: number;
  children?: ReactNode;
}

export function TabsVisual(props: TabsVisualProps) {
  const { variant, color, theme, surfaceDirection, size, children, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiTabs');

  return (
    <div
      {...rest}
      style={{ '--djui-component-tabs--size': size !== undefined ? size + 'rem' : undefined, '--djui-current-color-rgb': color !== undefined ? 'var(--djui-' + color + '-rgb)' : undefined, '--djui-current-color-contrast-rgb': color !== undefined ? 'var(--djui-' + color + '-contrast-rgb, var(--djui-foreground-contrast-rgb))' : undefined, '--djui-current-color-light-rgb': color !== undefined ? 'var(--djui-' + color + '-light-rgb)' : undefined, '--djui-current-color-lighter-rgb': color !== undefined ? 'var(--djui-' + color + '-lighter-rgb)' : undefined, '--djui-current-color-lightest-rgb': color !== undefined ? 'var(--djui-' + color + '-lightest-rgb)' : undefined, '--djui-current-color-dark-rgb': color !== undefined ? 'var(--djui-' + color + '-dark-rgb)' : undefined, '--djui-current-color-darker-rgb': color !== undefined ? 'var(--djui-' + color + '-darker-rgb)' : undefined, '--djui-current-color-darkest-rgb': color !== undefined ? 'var(--djui-' + color + '-darkest-rgb)' : undefined, '--djui-current-color-hover-rgb': color !== undefined ? 'var(--djui-' + color + '-hover-rgb)' : undefined, '--djui-current-color-active-rgb': color !== undefined ? 'var(--djui-' + color + '-active-rgb)' : undefined, ...style }}
      className={bem(undefined, { folder: (theme ?? componentDefault('Tabs', 'theme')) === 'folder', 'surface-previous': (theme ?? componentDefault('Tabs', 'theme')) === 'folder' && surfaceDirection === 'previous', solid: (theme ?? componentDefault('Tabs', 'theme')) !== 'folder' && variant === 'solid', colored: (theme ?? componentDefault('Tabs', 'theme')) !== 'folder' && color !== undefined }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      {props.children}
    </div>
  );
}
