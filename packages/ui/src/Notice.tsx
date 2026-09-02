import type { ReactNode, ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import './Notice.scss';

interface NoticeProps extends ComponentPropsWithRef<'div'> {
  context?: 'success' | 'error' | 'warning' | 'info';
  variant?: 'soft' | 'solid';
  title?: string;
  elevated?: boolean;
  role?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Notice(props: NoticeProps) {
  const { context, variant = 'soft', title, elevated, role, icon, children, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiNotice');

  return (
    <div
      {...rest}
      data-djui-next-surface=""
      role={role !== undefined ? role : (context === 'error' ? 'alert' : 'status')}
      style={style}
      className={bem(undefined, { soft: variant === 'soft', solid: variant === 'solid', success: context === 'success', error: context === 'error', warning: context === 'warning', info: context === 'info', elevated: elevated === true }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      {props.icon && (
        <div className="DjuiNotice__icon">
          {props.icon}
        </div>
      )}
      <div className="DjuiNotice__content">
        {title && <div className="DjuiNotice__title">{title}</div>}
        <div className="DjuiNotice__description">
          {props.children}
        </div>
      </div>
    </div>
  );
}
