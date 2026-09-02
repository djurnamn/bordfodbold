import type { ReactNode } from 'react';
import { useBem } from 'use-bem/react';
import './AuthTemplate.scss';

interface AuthTemplateProps {
  headerProps?: Record<string, unknown>;
  mainProps?: Record<string, unknown>;
  header?: ReactNode;
  children?: ReactNode;
}

export function AuthTemplate(props: AuthTemplateProps) {
  const { headerProps, mainProps } = props;

  const bem = useBem('DjuiAuthTemplate');

  return (
    <div className={bem()}>
      <div {...headerProps} className="DjuiAuthTemplate__header">
        {props.header}
      </div>
      <div className="DjuiAuthTemplate__body">
        <div className="DjuiAuthTemplate__container">
          <div {...mainProps} className="DjuiAuthTemplate__main">
            <div className="DjuiAuthTemplate__inner">
              {props.children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
