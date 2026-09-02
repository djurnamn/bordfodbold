import type { ReactNode } from 'react';
import { AvatarDriver } from './AvatarDriver';
import { AvatarVisual } from './AvatarVisual';

interface AvatarProps {
  image?: string;
  alt?: string;
  onStatusChange?: (status: 'loaded' | 'error') => void;
  fallback?: ReactNode;
}

export function Avatar(props: AvatarProps) {
  const { image, alt, onStatusChange } = props;

  return (
    <AvatarDriver onStatusChange={onStatusChange}>
      {({ api }) => (
        <>
          {props.fallback ? (
            <AvatarVisual
              {...api.getRootProps()}
              image={image}
              alt={alt}
              imageProps={api.getImageProps()}
              fallbackProps={api.getFallbackProps()}
              fallback={
                <>
                  {props.fallback}
                </>
              }
            />
          ) : (
            <AvatarVisual
              {...api.getRootProps()}
              image={image}
              alt={alt}
              imageProps={api.getImageProps()}
              fallbackProps={api.getFallbackProps()}
            />
          )}
        </>
      )}
    </AvatarDriver>
  );
}
