import type { ReactNode, ComponentPropsWithRef, ElementType } from 'react';
import { useBem } from 'use-bem/react';
import { SwitchTrackVisual } from './SwitchTrackVisual'
import './SwitchVisual.scss';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

interface SwitchVisualProps extends ComponentPropsWithRef<'label'> {
  color?: `accent-${string}` | `context-${string}` | `foreground-${string}` | `surface-${string}` | 'backdrop';
  size?: number;
  checked?: boolean;
  error?: boolean;
  disabled?: boolean;
  neutral?: boolean;
  inlineLabel?: string;
  labelPlacement?: 'start' | 'end';
  description?: string;
  changesWithState?: boolean;
  standalone?: boolean;
  inputProps?: Record<string, unknown>;
  controlProps?: Record<string, unknown>;
  labelProps?: Record<string, unknown>;
  startLabel?: ReactNode;
  endLabel?: ReactNode;
}

export function SwitchVisual(props: SwitchVisualProps) {
  const { color, size, checked, error, disabled, neutral, inlineLabel, labelPlacement, description, changesWithState, standalone, inputProps, controlProps, labelProps, startLabel, endLabel, className, style, ref, ...rest } = props;

  const RootTag = (standalone === false ? 'span' : 'label') as ElementType<ComponentPropsWithRef<'label'>>;

  const bem = useBem('DjuiSwitch');

  return (
    <RootTag
      {...rest}
      style={{ '--djui-current-color-rgb': color !== undefined ? 'var(--djui-' + color + '-rgb)' : undefined, '--djui-current-color-contrast-rgb': color !== undefined ? 'var(--djui-' + color + '-contrast-rgb, var(--djui-foreground-contrast-rgb))' : undefined, '--djui-current-color-light-rgb': color !== undefined ? 'var(--djui-' + color + '-light-rgb)' : undefined, '--djui-current-color-lighter-rgb': color !== undefined ? 'var(--djui-' + color + '-lighter-rgb)' : undefined, '--djui-current-color-lightest-rgb': color !== undefined ? 'var(--djui-' + color + '-lightest-rgb)' : undefined, '--djui-current-color-dark-rgb': color !== undefined ? 'var(--djui-' + color + '-dark-rgb)' : undefined, '--djui-current-color-darker-rgb': color !== undefined ? 'var(--djui-' + color + '-darker-rgb)' : undefined, '--djui-current-color-darkest-rgb': color !== undefined ? 'var(--djui-' + color + '-darkest-rgb)' : undefined, '--djui-current-color-hover-rgb': color !== undefined ? 'var(--djui-' + color + '-hover-rgb)' : undefined, '--djui-current-color-active-rgb': color !== undefined ? 'var(--djui-' + color + '-active-rgb)' : undefined, '--djui-component-switch--size': size !== undefined ? size + 'rem' : undefined, ...style }}
      className={bem(undefined, { colored: color !== undefined, error: error === true, disabled: disabled === true, checked: checked === true, 'changes-with-state': changesWithState === true, bare: standalone === false }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      <span className="DjuiSwitch__label DjuiSwitch__label--start">
        {props.startLabel}
        {inlineLabel && labelPlacement === 'start' && (
          <span className="DjuiSwitch__inline-label">{inlineLabel}</span>
        )}
        {description && labelPlacement === 'start' && (
          <span className="DjuiSwitch__description">{description}</span>
        )}
      </span>
      <span className="DjuiSwitch__control">
        <input {...inputProps} className="DjuiSwitch__input" />
        <SwitchTrackVisual
          {...controlProps}
          checked={checked}
          neutral={neutral}
        />
      </span>
      <span
        {...labelProps}
        className="DjuiSwitch__label DjuiSwitch__label--end"
      >
        {props.endLabel}
        {inlineLabel && labelPlacement !== 'start' && (
          <span className="DjuiSwitch__inline-label">{inlineLabel}</span>
        )}
        {description && labelPlacement !== 'start' && (
          <span className="DjuiSwitch__description">{description}</span>
        )}
      </span>
    </RootTag>
  );
}
