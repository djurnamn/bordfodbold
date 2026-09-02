import type { ReactNode, ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import './PageHeader.scss';

interface PageHeaderProps extends ComponentPropsWithRef<'header'> {
  title?: string;
  description?: ReactNode;
}

export function PageHeader(props: PageHeaderProps) {
  const { title, description, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiPageHeader');

  return (
    <header
      {...rest}
      style={style}
      className={bem() + (className ? ' ' + className : '')}
      ref={ref}
    >
      <div className="DjuiPageHeader__inner">
        <h1 className="DjuiPageHeader__title">{title}</h1>
        {props.description && (
          <p className="DjuiPageHeader__description">
            {props.description}
          </p>
        )}
      </div>
    </header>
  );
}
