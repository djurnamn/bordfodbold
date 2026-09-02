import type { ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import { Icon } from './Icon'
import { componentDefault, componentDefaultFlag } from './scripts';
import type { KeyboardEventHandler } from 'react'
import './StepperVisual.scss';

type StepperVisualProps =
  | (ComponentPropsWithRef<'span'> & {
      size?: number;
      value?: string | number;
      valueNow?: number;
      valueText?: string;
      min?: number;
      max?: number;
      disabled?: boolean;
      color?: `accent-${string}` | `context-${string}` | `foreground-${string}` | `surface-${string}` | 'backdrop';
      surfaceDirection?: 'next' | 'previous';
      rounded?: boolean;
      radius?: false | string;
      onValueKeydown?: KeyboardEventHandler<HTMLSpanElement>;
      decrementTriggerProps?: Record<string, unknown>;
      valueLabel?: string;
      incrementTriggerProps?: Record<string, unknown>;
      nonInteractive: true;
    })
  | (ComponentPropsWithRef<'span'> & {
      size?: number;
      value?: string | number;
      valueNow?: number;
      valueText?: string;
      min?: number;
      max?: number;
      disabled?: boolean;
      color?: `accent-${string}` | `context-${string}` | `foreground-${string}` | `surface-${string}` | 'backdrop';
      surfaceDirection?: 'next' | 'previous';
      rounded?: boolean;
      radius?: false | string;
      onValueKeydown?: KeyboardEventHandler<HTMLSpanElement>;
      decrementTriggerProps?: Record<string, unknown>;
      valueLabel?: string;
      incrementTriggerProps?: Record<string, unknown>;
      nonInteractive?: false;
    });

export function StepperVisual(props: StepperVisualProps) {
  const bem = useBem('DjuiStepper');
  if (props.nonInteractive) {
    const { size, value, valueNow, valueText, min, max, disabled, color, surfaceDirection, rounded, radius, onValueKeydown, decrementTriggerProps, valueLabel, incrementTriggerProps, nonInteractive, className, style, ref, ...rest } = props;
    return (
      <span
        {...rest}
        style={style}
        className={bem(undefined, { 'non-interactive': nonInteractive }) + (className ? ' ' + className : '')}
        ref={ref}
      >
        {value}
      </span>
    );
  }

  const { size, value, valueNow, valueText, min, max, disabled, color, surfaceDirection, rounded, radius, onValueKeydown, decrementTriggerProps, valueLabel, incrementTriggerProps, nonInteractive, className, style, ref, ...rest } = props;
  return (
    <span
      {...rest}
      style={{ '--djui-component-stepper--size': size !== undefined ? size + 'rem' : undefined, '--djui-component-stepper--radius': typeof radius === 'string' && radius !== 'inherit' && rounded !== true ? radius : undefined, '--djui-current-color-rgb': (color ?? componentDefault('Stepper', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Stepper', 'color'))) + '-rgb)' : undefined, '--djui-current-color-contrast-rgb': (color ?? componentDefault('Stepper', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Stepper', 'color'))) + '-contrast-rgb, var(--djui-foreground-contrast-rgb))' : undefined, '--djui-current-color-light-rgb': (color ?? componentDefault('Stepper', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Stepper', 'color'))) + '-light-rgb)' : undefined, '--djui-current-color-lighter-rgb': (color ?? componentDefault('Stepper', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Stepper', 'color'))) + '-lighter-rgb)' : undefined, '--djui-current-color-lightest-rgb': (color ?? componentDefault('Stepper', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Stepper', 'color'))) + '-lightest-rgb)' : undefined, '--djui-current-color-dark-rgb': (color ?? componentDefault('Stepper', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Stepper', 'color'))) + '-dark-rgb)' : undefined, '--djui-current-color-darker-rgb': (color ?? componentDefault('Stepper', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Stepper', 'color'))) + '-darker-rgb)' : undefined, '--djui-current-color-darkest-rgb': (color ?? componentDefault('Stepper', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Stepper', 'color'))) + '-darkest-rgb)' : undefined, '--djui-current-color-hover-rgb': (color ?? componentDefault('Stepper', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Stepper', 'color'))) + '-hover-rgb)' : undefined, '--djui-current-color-active-rgb': (color ?? componentDefault('Stepper', 'color')) !== undefined ? 'var(--djui-' + String((color ?? componentDefault('Stepper', 'color'))) + '-active-rgb)' : undefined, ...style }}
      className={bem(undefined, { disabled: disabled === true, colored: (color ?? componentDefault('Stepper', 'color')) !== undefined, 'surface-previous': surfaceDirection === 'previous', rounded: (rounded ?? componentDefaultFlag('Stepper', 'rounded')) === true, square: radius === false, 'radius-inherit': radius === 'inherit' }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      <button
        {...decrementTriggerProps}
        className="DjuiStepper__decrement"
        type="button"
      >
        <Icon name="minus" />
      </button>
      <span
        className="DjuiStepper__value"
        role="spinbutton"
        aria-label={valueLabel}
        tabIndex={disabled ? undefined : 0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={valueNow}
        aria-valuetext={valueText}
        aria-disabled={disabled ? true : undefined}
        onKeyDown={onValueKeydown}
      >
        {value}
      </span>
      <button
        {...incrementTriggerProps}
        className="DjuiStepper__increment"
        type="button"
      >
        <Icon name="plus" />
      </button>
    </span>
  );
}
