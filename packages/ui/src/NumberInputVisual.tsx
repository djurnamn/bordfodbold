import type { ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import { Icon } from './Icon'
import './NumberInputVisual.scss';

type NumberInputVisualProps =
  | (ComponentPropsWithRef<'div'> & {
      size?: number;
      value?: string | number | null;
      placeholder?: string;
      stepper?: boolean;
      disabled?: boolean;
      radius?: false | string;
      padding?: 'inherit';
      inputProps?: Record<string, unknown>;
      decrementTriggerProps?: Record<string, unknown>;
      incrementTriggerProps?: Record<string, unknown>;
      nonInteractive: true;
    })
  | (ComponentPropsWithRef<'div'> & {
      size?: number;
      value?: string | number | null;
      placeholder?: string;
      stepper?: boolean;
      disabled?: boolean;
      radius?: false | string;
      padding?: 'inherit';
      inputProps?: Record<string, unknown>;
      decrementTriggerProps?: Record<string, unknown>;
      incrementTriggerProps?: Record<string, unknown>;
      nonInteractive?: false;
    });

export function NumberInputVisual(props: NumberInputVisualProps) {
  const bem = useBem('DjuiNumberInput');
  if (props.nonInteractive) {
    const { size, value, placeholder, stepper, disabled, radius, padding, inputProps, decrementTriggerProps, incrementTriggerProps, nonInteractive, className, style, ref, ...rest } = props;
    return (
      <div
        {...rest}
        style={{ '--djui-component-number-input--size': size !== undefined ? size + 'rem' : undefined, '--djui-component-number-input--radius': typeof radius === 'string' && radius !== 'inherit' ? radius : undefined, ...style }}
        className={bem(undefined, { 'non-interactive': nonInteractive, placeholder: (value === undefined || value === null || value === '') && placeholder !== undefined, square: radius === false, 'radius-inherit': radius === 'inherit', 'padding-inherit': padding === 'inherit' }) + (className ? ' ' + className : '')}
        ref={ref}
      >
        {value !== undefined && value !== null && value !== '' ? value : placeholder}
      </div>
    );
  }

  const { size, value, placeholder, stepper, disabled, radius, padding, inputProps, decrementTriggerProps, incrementTriggerProps, nonInteractive, className, style, ref, ...rest } = props;
  return (
    <div
      {...rest}
      style={{ '--djui-component-number-input--size': size !== undefined ? size + 'rem' : undefined, '--djui-component-number-input--radius': typeof radius === 'string' && radius !== 'inherit' ? radius : undefined, ...style }}
      className={bem(undefined, { stepper: stepper === true, spinner: stepper !== true, disabled: disabled === true, square: radius === false, 'radius-inherit': radius === 'inherit', 'padding-inherit': padding === 'inherit' }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      {stepper === true && (
        <button
          {...decrementTriggerProps}
          className="DjuiNumberInput__decrement"
          type="button"
          tabIndex={0}
        >
          <Icon name="minus" />
        </button>
      )}
      <input
        {...inputProps}
        className="DjuiNumberInput__input"
        placeholder={placeholder}
      />
      {stepper === true ? (
        <button
          {...incrementTriggerProps}
          className="DjuiNumberInput__increment"
          type="button"
          tabIndex={0}
        >
          <Icon name="plus" />
        </button>
      ) : (
        <div className="DjuiNumberInput__spinner">
          <button
            {...incrementTriggerProps}
            className="DjuiNumberInput__increment"
            type="button"
            tabIndex={0}
          >
            <Icon name="chevron-up" />
          </button>
          <button
            {...decrementTriggerProps}
            className="DjuiNumberInput__decrement"
            type="button"
            tabIndex={0}
          >
            <Icon name="chevron-down" />
          </button>
        </div>
      )}
    </div>
  );
}
