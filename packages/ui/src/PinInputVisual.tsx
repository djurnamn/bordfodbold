import type { ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import './PinInputVisual.scss';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

interface PinInputVisualProps extends ComponentPropsWithRef<'div'> {
  size?: number;
  radius?: false | string;
  disabled?: boolean;
  error?: boolean;
  hiddenInputProps?: Record<string, unknown>;
  controlProps?: Record<string, unknown>;
  cells: Record<string, unknown>[];
}

export function PinInputVisual(props: PinInputVisualProps) {
  const { size, radius, disabled, error, hiddenInputProps, controlProps, cells, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiPinInput');

  return (
    <div
      {...rest}
      style={{ '--djui-component-pin-input--size': size !== undefined ? size + 'rem' : undefined, '--djui-component-pin-input--radius': typeof radius === 'string' && radius !== 'inherit' ? radius : undefined, ...style }}
      className={bem(undefined, { disabled: disabled === true, error: error === true, square: radius === false }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      <input {...hiddenInputProps} className="DjuiPinInput__hidden" />
      <div {...controlProps} className="DjuiPinInput__control">
        {cells.map((cell, index) => (
          <input key={index} {...cell} className="DjuiPinInput__cell" />
        ))}
      </div>
    </div>
  );
}
