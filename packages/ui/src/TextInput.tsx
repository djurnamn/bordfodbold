import type { ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import type { FormEventHandler } from 'react'
import './TextInput.scss';

type TextInputProps =
  | (ComponentPropsWithRef<'div'> & {
      size?: number;
      value?: string | number;
      placeholder?: string;
      radius?: false | string;
      padding?: 'inherit';
      onChange?: FormEventHandler<HTMLInputElement>;
      nonInteractive: true;
    })
  | (ComponentPropsWithRef<'input'> & {
      size?: number;
      value?: string | number;
      placeholder?: string;
      radius?: false | string;
      padding?: 'inherit';
      onChange?: FormEventHandler<HTMLInputElement>;
      nonInteractive?: false;
    });

export function TextInput(props: TextInputProps) {
  const bem = useBem('DjuiTextInput');
  if (props.nonInteractive) {
    const { size, value, placeholder, radius, padding, onChange, nonInteractive, className, style, ref, ...rest } = props;
    return (
      <div
        {...rest}
        style={{ '--djui-component-text-input--size': size !== undefined ? size + 'rem' : undefined, '--djui-component-text-input--radius': typeof radius === 'string' && radius !== 'inherit' ? radius : undefined, ...style }}
        className={bem(undefined, { 'non-interactive': nonInteractive, placeholder: (value === undefined || value === null || value === '') && placeholder !== undefined, square: radius === false, 'radius-inherit': radius === 'inherit', 'padding-inherit': padding === 'inherit' }) + (className ? ' ' + className : '')}
        ref={ref}
      >
        {value !== undefined && value !== null && value !== '' ? value : placeholder}
      </div>
    );
  }

  const { size, value, placeholder, radius, padding, onChange, nonInteractive, className, style, ref, ...rest } = props;
  return (
    <input
      {...rest}
      value={value}
      placeholder={placeholder}
      style={{ '--djui-component-text-input--size': size !== undefined ? size + 'rem' : undefined, '--djui-component-text-input--radius': typeof radius === 'string' && radius !== 'inherit' ? radius : undefined, ...style }}
      className={bem(undefined, { square: radius === false, 'radius-inherit': radius === 'inherit', 'padding-inherit': padding === 'inherit' }) + (className ? ' ' + className : '')}
      onInput={onChange}
      ref={ref}
    />
  );
}
