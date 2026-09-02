import { StepperDriver } from './StepperDriver';
import { StepperVisual } from './StepperVisual';
import { createStepperKeydown, stepperTriggerProps, stepperValueLabel, stepperValueText } from './scripts';
import type { StepperTranslations } from './scripts';

interface StepperProps {
  value?: number | null;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  decrementDisabled?: boolean;
  incrementDisabled?: boolean;
  color?: `accent-${string}` | `context-${string}` | `foreground-${string}` | `surface-${string}` | 'backdrop';
  surfaceDirection?: 'next' | 'previous';
  rounded?: boolean;
  radius?: false | string;
  size?: number;
  nonInteractive?: boolean;
  locale?: string;
  formatOptions?: Intl.NumberFormatOptions;
  translations?: StepperTranslations;
  onChange?: (value: number | null) => void;
}

export function Stepper(props: StepperProps) {
  const { value, defaultValue, min, max, step, disabled, decrementDisabled, incrementDisabled, color, surfaceDirection, rounded, radius, size, nonInteractive, locale, formatOptions, translations, onChange } = props;

  return (
    <StepperDriver
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      locale={locale}
      formatOptions={formatOptions}
      translations={translations}
      onChange={onChange}
    >
      {({ api }) => (
        <StepperVisual
          {...api.getRootProps()}
          size={size}
          value={api.value}
          valueNow={Number.isNaN(api.valueAsNumber) ? undefined : api.valueAsNumber}
          valueText={stepperValueText(translations, api.value)}
          valueLabel={stepperValueLabel(translations)}
          min={min}
          max={max}
          disabled={disabled}
          color={color}
          surfaceDirection={surfaceDirection}
          rounded={rounded}
          radius={radius}
          nonInteractive={nonInteractive}
          onValueKeydown={createStepperKeydown(api)}
          decrementTriggerProps={stepperTriggerProps(decrementDisabled === true ? { ...api.getDecrementTriggerProps(), disabled: true } : api.getDecrementTriggerProps())}
          incrementTriggerProps={stepperTriggerProps(incrementDisabled === true ? { ...api.getIncrementTriggerProps(), disabled: true } : api.getIncrementTriggerProps())}
        />
      )}
    </StepperDriver>
  );
}
