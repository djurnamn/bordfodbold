import type { ReactNode, ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import { Icon } from './Icon'
import './AvatarVisual.scss';

interface AvatarVisualProps extends ComponentPropsWithRef<'span'> {
  image?: string;
  alt?: string;
  imageProps?: Record<string, unknown>;
  fallbackProps?: Record<string, unknown>;
  fallback?: ReactNode;
}

export function AvatarVisual(props: AvatarVisualProps) {
  const { image, alt, imageProps, fallbackProps, fallback, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiAvatar');

  return (
    <span
      {...rest}
      style={style}
      className={bem() + (className ? ' ' + className : '')}
      ref={ref}
    >
      {image && (
        <img
          {...imageProps}
          className="DjuiAvatar__image"
          src={image}
          alt={alt}
        />
      )}
      <span {...fallbackProps} className="DjuiAvatar__fallback">
        {props.fallback ?? <Icon name="user" size={1} />}
      </span>
    </span>
  );
}
