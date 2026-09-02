import type { ReactNode, ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import { stackStyle } from './scripts';
import type { Responsive, StackDirection, StackAlign, StackJustify } from './scripts';
import './Stack.scss';

interface StackProps extends ComponentPropsWithRef<'div'> {
  direction?: Responsive<StackDirection>;
  align?: StackAlign;
  gap?: string;
  justify?: StackJustify;
  wrap?: boolean;
  children?: ReactNode;
}

export function Stack(props: StackProps) {
  const { direction, align, gap, justify, wrap, children, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiStack');

  return (
    <div
      {...rest}
      style={{ ...stackStyle(direction, align, gap, justify), ...style }}
      className={bem(undefined, { wrap: wrap }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      {props.children}
    </div>
  );
}
