import type { ReactNode, ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import './AuthTemplateSection.scss';

interface AuthTemplateSectionProps extends ComponentPropsWithRef<'div'> {
  children?: ReactNode;
}

export function AuthTemplateSection(props: AuthTemplateSectionProps) {
  const { children, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiAuthTemplateSection');

  return (
    <div
      {...rest}
      data-djui-next-surface=""
      style={style}
      className={bem() + (className ? ' ' + className : '')}
      ref={ref}
    >
      {props.children}
    </div>
  );
}
