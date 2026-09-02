import type { ReactNode, ComponentPropsWithRef, ElementType } from 'react';
import { useBem } from 'use-bem/react';
import './Typography.scss';

interface TypographyProps extends ComponentPropsWithRef<'span'> {
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  variant?: 'title' | 'heading' | 'subheading' | 'label' | 'body' | 'small' | 'caption' | 'numeric' | 'code' | (string & {});
  children?: ReactNode;
}

export function Typography(props: TypographyProps) {
  const { tag = 'span', variant, children, className, style, ref, ...rest } = props;

  const RootTag = (tag) as ElementType<ComponentPropsWithRef<'span'>>;

  const bem = useBem('DjuiTypography');

  return (
    <RootTag
      {...rest}
      className={bem() + ((variant !== undefined ? 'DjuiTypography--' + variant : undefined) ? ' ' + (variant !== undefined ? 'DjuiTypography--' + variant : undefined) : '') + (className ? ' ' + className : '')}
      style={style}
      ref={ref}
    >
      {props.children}
    </RootTag>
  );
}
