import { pinInputCellProps, pinInputFirstCellId } from './scripts';
import { PinInputDriver } from './PinInputDriver';
import { PinInputVisual } from './PinInputVisual';
import type { PinInputTranslations } from './scripts';

interface PinInputProps {
  inputProps?: Record<string, unknown>;
  value?: string;
  defaultValue?: string;
  length?: number;
  type?: 'numeric' | 'alphanumeric' | 'alphabetic';
  mask?: boolean;
  otp?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  blurOnComplete?: boolean;
  selectOnFocus?: boolean;
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  readOnly?: boolean;
  name?: string;
  form?: string;
  translations?: PinInputTranslations;
  size?: number;
  radius?: false | string;
  rootProps?: Record<string, unknown>;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  onInvalid?: (character: string, index: number) => void;
}

export function PinInput(props: PinInputProps) {
  const { inputProps, value, defaultValue, length, type, mask, otp, placeholder, autoFocus, blurOnComplete, selectOnFocus, disabled, error, required, readOnly, name, form, translations, size, radius, rootProps, onChange, onComplete, onInvalid } = props;

  return (
    <PinInputDriver
      value={value}
      defaultValue={defaultValue}
      length={length}
      type={type}
      mask={mask}
      otp={otp}
      placeholder={placeholder}
      autoFocus={autoFocus}
      blurOnComplete={blurOnComplete}
      selectOnFocus={selectOnFocus}
      disabled={disabled}
      error={error}
      required={required}
      readOnly={readOnly}
      name={name}
      form={form}
      inputId={pinInputFirstCellId(inputProps)}
      translations={translations}
      onChange={onChange}
      onComplete={onComplete}
      onInvalid={onInvalid}
    >
      {({ api }) => (
        <PinInputVisual
          {...{ ...api.getRootProps(), ...rootProps }}
          size={size}
          radius={radius}
          disabled={disabled}
          error={error}
          hiddenInputProps={api.getHiddenInputProps()}
          controlProps={api.getControlProps()}
          cells={pinInputCellProps(api, inputProps)}
        />
      )}
    </PinInputDriver>
  );
}
