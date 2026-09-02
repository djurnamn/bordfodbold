import type { ReactNode, ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import './TemplateHeader.scss';

interface TemplateHeaderProps extends ComponentPropsWithRef<'header'> {
  side?: 'left' | 'right' | 'none';
  brand?: ReactNode;
  navigation?: ReactNode;
  actions?: ReactNode;
}

export function TemplateHeader(props: TemplateHeaderProps) {
  const { side, brand, navigation, actions, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiTemplateHeader');

  return (
    <header
      {...rest}
      style={style}
      className={bem(undefined, { 'side-right': side === 'right', 'side-none': side === 'none' }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      <div className="DjuiTemplateHeader__inner">
        <div className="DjuiTemplateHeader__brand">
          {props.brand}
        </div>
        <div className="DjuiTemplateHeader__navigation">
          {props.navigation}
        </div>
        <div className="DjuiTemplateHeader__actions">
          {props.actions}
        </div>
      </div>
    </header>
  );
}
