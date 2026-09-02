import type { ReactNode, ComponentPropsWithRef, ElementType } from 'react';
import { useBem } from 'use-bem/react';
import { Icon } from './Icon'
import { SwitchTrackVisual } from './SwitchTrackVisual'
import { resolveModeSwitchTranslations, type ModeSwitchTranslations } from './scripts';
import './ModeSwitch.scss';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

interface ModeSwitchProps extends ComponentPropsWithRef<'label'> {
  mode?: 'light' | 'dark';
  color?: `accent-${string}` | `context-${string}` | `foreground-${string}` | `surface-${string}` | 'backdrop';
  translations?: ModeSwitchTranslations;
  standalone?: boolean;
  nonInteractive?: boolean;
  onModeChange?: () => void;
  darkIcon?: ReactNode;
  lightIcon?: ReactNode;
}

export function ModeSwitch(props: ModeSwitchProps) {
  const { mode, color, translations, standalone, nonInteractive, onModeChange, darkIcon, lightIcon, className, style, ref, ...rest } = props;

  const RootTag = (standalone === false ? 'span' : 'label') as ElementType<ComponentPropsWithRef<'label'>>;

  const bem = useBem('DjuiModeSwitch');

  return (
    <RootTag
      {...rest}
      className={bem(undefined, { colored: color !== undefined, bare: standalone === false }) + ('DjuiModeSwitch--' + mode ? ' ' + 'DjuiModeSwitch--' + mode : '') + (className ? ' ' + className : '')}
      style={{ '--djui-current-color-rgb': color !== undefined ? 'var(--djui-' + color + '-rgb)' : undefined, '--djui-current-color-contrast-rgb': color !== undefined ? 'var(--djui-' + color + '-contrast-rgb, var(--djui-foreground-contrast-rgb))' : undefined, '--djui-current-color-light-rgb': color !== undefined ? 'var(--djui-' + color + '-light-rgb)' : undefined, '--djui-current-color-lighter-rgb': color !== undefined ? 'var(--djui-' + color + '-lighter-rgb)' : undefined, '--djui-current-color-lightest-rgb': color !== undefined ? 'var(--djui-' + color + '-lightest-rgb)' : undefined, '--djui-current-color-dark-rgb': color !== undefined ? 'var(--djui-' + color + '-dark-rgb)' : undefined, '--djui-current-color-darker-rgb': color !== undefined ? 'var(--djui-' + color + '-darker-rgb)' : undefined, '--djui-current-color-darkest-rgb': color !== undefined ? 'var(--djui-' + color + '-darkest-rgb)' : undefined, '--djui-current-color-hover-rgb': color !== undefined ? 'var(--djui-' + color + '-hover-rgb)' : undefined, '--djui-current-color-active-rgb': color !== undefined ? 'var(--djui-' + color + '-active-rgb)' : undefined, ...style }}
      ref={ref}
    >
      <input
        className="DjuiModeSwitch__input"
        type="checkbox"
        aria-label={resolveModeSwitchTranslations(translations).toggleLabel}
        checked={mode === 'light'}
        disabled={nonInteractive}
        readOnly={onModeChange === undefined || nonInteractive === true}
        onChange={onModeChange}
      />
      <div className="DjuiModeSwitch__icon DjuiModeSwitch__icon--dark">
        {props.darkIcon ?? <Icon name="moon" size={1} />}
      </div>
      <SwitchTrackVisual checked={mode === 'light'} neutral />
      <div className="DjuiModeSwitch__icon DjuiModeSwitch__icon--light">
        {props.lightIcon ?? <Icon name="sun" size={1} />}
      </div>
    </RootTag>
  );
}
