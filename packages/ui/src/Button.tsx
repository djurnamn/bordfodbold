import type { ReactNode, ComponentPropsWithRef, ElementType } from 'react';
import { useBem } from 'use-bem/react';
import { IconLabel } from './IconLabel'
import { componentDefault, componentDefaultFlag, warnUnnamedIconButton } from './scripts';
import type { MouseEventHandler } from 'react'
import './Button.scss';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

interface ButtonProps extends ComponentPropsWithRef<'button'> {
  label?: string;
  size?: number;
  variant?: 'soft' | 'solid' | 'plain' | 'surface';
  surfaceDirection?: 'next' | 'previous';
  color?: `accent-${string}` | `context-${string}` | `foreground-${string}` | `surface-${string}` | 'backdrop';
  rounded?: boolean;
  radius?: false | string;
  hatched?: boolean;
  elevation?: string;
  nonInteractive?: boolean;
  type?: 'button' | 'submit' | 'reset';
  as?: ElementType;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Button(props: ButtonProps) {
  const { label, size, variant, surfaceDirection, color, rounded, radius, hatched, elevation, nonInteractive, type, as, onClick, icon, children, className, style, ref, ...rest } = props;

  const RootTag = (nonInteractive ? 'div' : (as ?? 'button')) as ElementType<ComponentPropsWithRef<'button'>>;

  const bem = useBem('DjuiButton');

  warnUnnamedIconButton('Button', { icon, label, children, attributes: rest });

  return (
    <RootTag
      {...rest}
      type={nonInteractive ? undefined : (type !== undefined ? type : (as !== undefined ? undefined : 'button'))}
      style={{ '--djui-component-button--size': size !== undefined ? size + 'rem' : undefined, '--djui-component-button--radius': typeof radius === 'string' && radius !== 'inherit' && rounded !== true ? radius : undefined, '--djui-component-button--elevation': typeof elevation === 'string' ? 'var(--djui-shadow-' + elevation + ')' : undefined, '--djui-current-color-rgb': (color ?? componentDefault('Button', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Button', 'color'))) + '-rgb)' : undefined, '--djui-current-color-contrast-rgb': (color ?? componentDefault('Button', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Button', 'color'))) + '-contrast-rgb, var(--djui-foreground-contrast-rgb))' : undefined, '--djui-current-color-light-rgb': (color ?? componentDefault('Button', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Button', 'color'))) + '-light-rgb)' : undefined, '--djui-current-color-lighter-rgb': (color ?? componentDefault('Button', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Button', 'color'))) + '-lighter-rgb)' : undefined, '--djui-current-color-lightest-rgb': (color ?? componentDefault('Button', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Button', 'color'))) + '-lightest-rgb)' : undefined, '--djui-current-color-dark-rgb': (color ?? componentDefault('Button', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Button', 'color'))) + '-dark-rgb)' : undefined, '--djui-current-color-darker-rgb': (color ?? componentDefault('Button', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Button', 'color'))) + '-darker-rgb)' : undefined, '--djui-current-color-darkest-rgb': (color ?? componentDefault('Button', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Button', 'color'))) + '-darkest-rgb)' : undefined, '--djui-current-color-hover-rgb': (color ?? componentDefault('Button', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Button', 'color'))) + '-hover-rgb)' : undefined, '--djui-current-color-active-rgb': (color ?? componentDefault('Button', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Button', 'color'))) + '-active-rgb)' : undefined, ...style }}
      className={bem(undefined, { plain: (variant ?? componentDefault('Button', 'variant') ?? 'solid') === 'plain', soft: (variant ?? componentDefault('Button', 'variant') ?? 'solid') === 'soft', solid: (variant ?? componentDefault('Button', 'variant') ?? 'solid') === 'solid', surface: (variant ?? componentDefault('Button', 'variant') ?? 'solid') === 'surface', 'surface-pinned': (variant ?? componentDefault('Button', 'variant') ?? 'solid') === 'surface' && ((color ?? componentDefault('Button', 'color')) !== undefined && String((color ?? componentDefault('Button', 'color'))).indexOf('surface-') === 0), 'surface-previous': (variant ?? componentDefault('Button', 'variant') ?? 'solid') === 'surface' && surfaceDirection === 'previous', colored: (color ?? componentDefault('Button', 'color')) !== undefined, rounded: (rounded ?? componentDefaultFlag('Button', 'rounded')) === true, 'icon-only': props.icon && !label, square: radius === false, 'radius-inherit': radius === 'inherit', hatched: hatched === true, interactive: !nonInteractive }) + (className ? ' ' + className : '')}
      onClick={onClick}
      ref={ref}
    >
      {props.icon ? (
        <IconLabel
          label={label}
          labelTypography="label"
          icon={
            <>
              {props.icon}
            </>
          }
        />
      ) : label ? (
        <IconLabel label={label} labelTypography="label" />
      ) : null}
      {props.children}
    </RootTag>
  );
}
