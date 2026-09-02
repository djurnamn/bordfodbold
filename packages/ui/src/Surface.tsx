import type { ReactNode, ComponentPropsWithRef, ElementType } from 'react';
import { useBem } from 'use-bem/react';
import { surfaceStyle } from './scripts';
import './Surface.scss';

interface SurfaceProps extends ComponentPropsWithRef<'div'> {
  as?: ElementType;
  interactive?: boolean;
  segmented?: boolean;
  level?: number;
  padding?: boolean | string;
  radius?: false | string;
  elevation?: false | 'default' | 'overlay' | 'heavy';
  border?: boolean;
  bevel?: boolean;
  children?: ReactNode;
}

export function Surface(props: SurfaceProps) {
  const { as, interactive, segmented, level, padding, radius, elevation, border, bevel, children, className, style, ref, ...rest } = props;

  const RootTag = (as ?? 'div') as ElementType<ComponentPropsWithRef<'div'>>;

  const bem = useBem('DjuiSurface');

  return (
    <RootTag
      {...rest}
      data-djui-next-surface={level === undefined ? '' : undefined}
      data-djui-set-surface={level !== undefined ? String(level) : undefined}
      style={{ ...surfaceStyle(padding, radius), ...style }}
      className={bem(undefined, { interactive: interactive, segmented: segmented, flush: padding === false, square: radius === false, 'radius-inherit': radius === 'inherit', flat: elevation === false, 'elevation-overlay': elevation === 'overlay', 'elevation-heavy': elevation === 'heavy', border: border, bevel: bevel }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      {props.children}
    </RootTag>
  );
}
