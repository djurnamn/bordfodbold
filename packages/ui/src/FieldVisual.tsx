import type { ReactNode, ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import { componentDefault } from './scripts';
import { resolveFieldTranslations, type FieldTranslations } from './scripts';
import './FieldVisual.scss';

interface FieldVisualProps extends ComponentPropsWithRef<'div'> {
  label?: string;
  theme?: 'floating' | 'none';
  error?: boolean;
  errorMessage?: string;
  description?: string;
  labelId?: string;
  descriptionId?: string;
  errorMessageId?: string;
  translations?: FieldTranslations;
  nonInteractive?: boolean;
  reserveLabelSpace?: boolean;
  htmlFor?: string;
  children?: ReactNode;
}

export function FieldVisual(props: FieldVisualProps) {
  const { label, theme, error, errorMessage, description, labelId, descriptionId, errorMessageId, translations, nonInteractive, reserveLabelSpace, htmlFor, children, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiField');

  return (
    <div
      {...rest}
      style={style}
      className={bem(undefined, { error: error || errorMessage !== undefined, 'non-interactive': nonInteractive, floating: (theme ?? componentDefault('Field', 'theme')) === 'floating', 'reserve-label': reserveLabelSpace === true }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      {label && (
        <>
          {nonInteractive ? (
            <span className="DjuiField__label" id={labelId}>{label}</span>
          ) : (
            <label className="DjuiField__label" id={labelId} htmlFor={htmlFor}>
              {label}
            </label>
          )}
        </>
      )}
      <div className="DjuiField__inner">
        {props.children}
      </div>
      {errorMessage !== undefined && (
        <div className="DjuiField__message" id={errorMessageId} role="alert">
          <span className="DjuiField__message-prefix">
            {resolveFieldTranslations(translations).errorPrefix + ' '}
          </span>
          {errorMessage}
        </div>
      )}
      {description !== undefined && (
        <div className="DjuiField__description" id={descriptionId}>
          {description}
        </div>
      )}
    </div>
  );
}
