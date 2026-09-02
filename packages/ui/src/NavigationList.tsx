import type { ReactNode, ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import './NavigationList.scss';

interface NavigationListProps extends ComponentPropsWithRef<'nav'> {
  label?: string;
  children?: ReactNode;
}

export function NavigationList(props: NavigationListProps) {
  const { label, children, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiNavigationList');

  return (
    <nav
      {...rest}
      style={style}
      className={bem() + (className ? ' ' + className : '')}
      ref={ref}
    >
      {label && <div className="DjuiNavigationList__label">{label}</div>}
      {props.children}
    </nav>
  );
}
