import type { ReactNode } from 'react';
import { mergeElementProps } from './scripts';
import { SwitchDriver } from './SwitchDriver';
import { SwitchVisual } from './SwitchVisual';

interface SwitchProps {
  inputProps?: Record<string, unknown>;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  readOnly?: boolean;
  name?: string;
  value?: string | number;
  form?: string;
  color?: `accent-${string}` | `context-${string}` | `foreground-${string}` | `surface-${string}` | 'backdrop';
  neutral?: boolean;
  inlineLabel?: string;
  labelPlacement?: 'start' | 'end';
  description?: string;
  changesWithState?: boolean;
  standalone?: boolean;
  onChange?: (checked: boolean) => void;
  startLabel?: ReactNode;
  endLabel?: ReactNode;
}

export function Switch(props: SwitchProps) {
  const { inputProps, checked, defaultChecked, disabled, error, required, readOnly, name, value, form, color, neutral, inlineLabel, labelPlacement, description, changesWithState, standalone, onChange } = props;

  return (
    <SwitchDriver
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      error={error}
      required={required}
      readOnly={readOnly}
      name={name}
      value={value}
      form={form}
      onChange={onChange}
    >
      {({ api }) => (
        <SwitchVisual
          {...standalone === false ? {} : api.getRootProps()}
          checked={api.checked}
          disabled={disabled}
          error={error}
          color={color}
          neutral={neutral}
          standalone={standalone}
          inlineLabel={inlineLabel}
          labelPlacement={labelPlacement}
          description={description}
          changesWithState={changesWithState}
          inputProps={mergeElementProps(api.getHiddenInputProps(), inputProps)}
          controlProps={api.getControlProps()}
          labelProps={api.getLabelProps()}
          startLabel={
            <>
              {props.startLabel}
            </>
          }
          endLabel={
            <>
              {props.endLabel}
            </>
          }
        />
      )}
    </SwitchDriver>
  );
}
