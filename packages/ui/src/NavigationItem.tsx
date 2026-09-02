import type { ReactNode, ComponentPropsWithRef, ElementType } from 'react';
import { useBem } from 'use-bem/react';
import { IconLabel } from './IconLabel'
import './NavigationItem.scss';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

interface NavigationItemProps extends ComponentPropsWithRef<'a'> {
  label?: string;
  active?: boolean;
  variant?: 'soft' | 'solid';
  color?: `accent-${string}` | `context-${string}` | `foreground-${string}` | `surface-${string}` | 'backdrop';
  href?: string;
  icon?: ReactNode;
}

export function NavigationItem(props: NavigationItemProps) {
  const { label, active, variant, color, href, icon, className, style, ref, ...rest } = props;

  const RootTag = (href !== undefined ? 'a' : 'div') as ElementType<ComponentPropsWithRef<'a'>>;

  const bem = useBem('DjuiNavigationItem');

  return (
    <RootTag
      {...rest}
      href={href}
      aria-current={href !== undefined && active === true ? 'page' : undefined}
      style={{ '--djui-current-color-rgb': color !== undefined ? 'var(--djui-' + color + '-rgb)' : undefined, '--djui-current-color-contrast-rgb': color !== undefined ? 'var(--djui-' + color + '-contrast-rgb, var(--djui-foreground-contrast-rgb))' : undefined, '--djui-current-color-light-rgb': color !== undefined ? 'var(--djui-' + color + '-light-rgb)' : undefined, '--djui-current-color-lighter-rgb': color !== undefined ? 'var(--djui-' + color + '-lighter-rgb)' : undefined, '--djui-current-color-lightest-rgb': color !== undefined ? 'var(--djui-' + color + '-lightest-rgb)' : undefined, '--djui-current-color-dark-rgb': color !== undefined ? 'var(--djui-' + color + '-dark-rgb)' : undefined, '--djui-current-color-darker-rgb': color !== undefined ? 'var(--djui-' + color + '-darker-rgb)' : undefined, '--djui-current-color-darkest-rgb': color !== undefined ? 'var(--djui-' + color + '-darkest-rgb)' : undefined, '--djui-current-color-hover-rgb': color !== undefined ? 'var(--djui-' + color + '-hover-rgb)' : undefined, '--djui-current-color-active-rgb': color !== undefined ? 'var(--djui-' + color + '-active-rgb)' : undefined, ...style }}
      className={bem(undefined, { active: active === true, soft: variant === 'soft', solid: variant === 'solid', colored: color !== undefined }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      {props.icon ? (
        <IconLabel
          label={label}
          icon={
            <>
              {props.icon}
            </>
          }
        />
      ) : (
        <IconLabel label={label} />
      )}
    </RootTag>
  );
}
