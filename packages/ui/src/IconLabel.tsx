import type { ReactNode, ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import './IconLabel.scss';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

interface IconLabelProps extends ComponentPropsWithRef<'span'> {
  label?: string;
  labelTypography?: 'label' | 'subheading' | 'body' | 'small' | 'caption' | 'heading' | 'title' | (string & {});
  icon?: ReactNode;
}

export function IconLabel(props: IconLabelProps) {
  const { label, labelTypography, icon, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiIconLabel');

  return (
    <span
      {...rest}
      style={{ '--djui-current-typography-font-weight': labelTypography !== undefined ? 'var(--djui-typography-' + labelTypography + '-font-weight)' : undefined, '--djui-current-typography-line-height': labelTypography !== undefined ? 'var(--djui-typography-' + labelTypography + '-line-height)' : undefined, '--djui-current-typography-letter-spacing': labelTypography !== undefined ? 'var(--djui-typography-' + labelTypography + '-letter-spacing)' : undefined, '--djui-current-typography-text-transform': labelTypography !== undefined ? 'var(--djui-typography-' + labelTypography + '-text-transform)' : undefined, '--djui-current-typography-font-family': labelTypography !== undefined ? 'var(--djui-typography-' + labelTypography + '-font-family)' : undefined, '--djui-current-typography-white-space': labelTypography !== undefined ? 'var(--djui-typography-' + labelTypography + '-white-space)' : undefined, '--djui-current-typography-font-variant-numeric': labelTypography !== undefined ? 'var(--djui-typography-' + labelTypography + '-font-variant-numeric)' : undefined, ...style }}
      className={bem() + (className ? ' ' + className : '')}
      ref={ref}
    >
      {props.icon && (
        <span className="DjuiIconLabel__icon">
          {props.icon}
        </span>
      )}
      {label && <span className="DjuiIconLabel__label">{label}</span>}
    </span>
  );
}
