import { mergeElementProps } from './scripts';
import { NumberInputDriver } from './NumberInputDriver';
import { NumberInputVisual } from './NumberInputVisual';
import type { NumberInputTranslations } from './scripts';

interface NumberInputProps {
  inputProps?: Record<string, unknown>;
  value?: number | null;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  decrementDisabled?: boolean;
  incrementDisabled?: boolean;
  name?: string;
  locale?: string;
  formatOptions?: Intl.NumberFormatOptions;
  translations?: NumberInputTranslations;
  stepper?: boolean;
  nonInteractive?: boolean;
  size?: number;
  placeholder?: string;
  radius?: 'inherit';
  padding?: 'inherit';
  rootProps?: Record<string, unknown>;
  onChange?: (value: number | null) => void;
  onChangeEnd?: (value: number | null) => void;
}

export function NumberInput(props: NumberInputProps) {
  const { inputProps, value, defaultValue, min, max, step, disabled, decrementDisabled, incrementDisabled, name, locale, formatOptions, translations, stepper, nonInteractive, size, placeholder, radius, padding, rootProps, onChange, onChangeEnd } = props;

  return (
    <NumberInputDriver
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      name={name}
      locale={locale}
      formatOptions={formatOptions}
      translations={translations}
      onChange={onChange}
      onChangeEnd={onChangeEnd}
    >
      {({ api }) => (
        <NumberInputVisual
          {...{ ...api.getRootProps(), ...rootProps }}
          size={size}
          value={value}
          placeholder={placeholder}
          stepper={stepper}
          disabled={disabled}
          nonInteractive={nonInteractive}
          radius={radius}
          padding={padding}
          inputProps={mergeElementProps(api.getInputProps(), inputProps)}
          decrementTriggerProps={decrementDisabled === true ? { ...api.getDecrementTriggerProps(), disabled: true } : api.getDecrementTriggerProps()}
          incrementTriggerProps={incrementDisabled === true ? { ...api.getIncrementTriggerProps(), disabled: true } : api.getIncrementTriggerProps()}
        />
      )}
    </NumberInputDriver>
  );
}
