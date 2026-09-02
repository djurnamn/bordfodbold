import { useBem } from 'use-bem/react';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

interface FallbackIconProps {
  name: 'moon' | 'sun' | 'menu' | 'x' | 'chevron-down' | 'chevron-up' | 'chevron-left' | 'chevron-right' | 'chevrons-left' | 'chevrons-right' | 'check' | 'user' | 'search' | 'languages' | 'plus' | 'minus' | 'grip-vertical' | 'upload' | 'copy';
  size?: number;
  strokeWidth?: number;
}

export function FallbackIcon(props: FallbackIconProps) {
  const { name, size, strokeWidth } = props;

  const bem = useBem('DjuiIcon');

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ '--djui-component-icon--size': size !== undefined ? size + 'rem' : undefined, '--djui-component-icon--stroke-width': strokeWidth !== undefined ? String(strokeWidth) : undefined }}
      className={bem()}
    >
      {name === 'moon' ? (
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      ) : name === 'sun' ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </>
      ) : name === 'menu' ? (
        <>
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </>
      ) : name === 'x' ? (
        <>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </>
      ) : name === 'chevron-down' ? (
        <path d="m6 9 6 6 6-6" />
      ) : name === 'chevron-up' ? (
        <path d="m18 15-6-6-6 6" />
      ) : name === 'chevron-left' ? (
        <path d="m15 18-6-6 6-6" />
      ) : name === 'chevron-right' ? (
        <path d="m9 18 6-6-6-6" />
      ) : name === 'chevrons-left' ? (
        <>
          <path d="m11 17-5-5 5-5" />
          <path d="m18 17-5-5 5-5" />
        </>
      ) : name === 'chevrons-right' ? (
        <>
          <path d="m6 17 5-5-5-5" />
          <path d="m13 17 5-5-5-5" />
        </>
      ) : name === 'check' ? (
        <path d="M20 6 9 17l-5-5" />
      ) : name === 'user' ? (
        <>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      ) : name === 'search' ? (
        <>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </>
      ) : name === 'languages' ? (
        <>
          <path d="m5 8 6 6" />
          <path d="m4 14 6-6 2-3" />
          <path d="M2 5h12" />
          <path d="M7 2h1" />
          <path d="m22 22-5-10-5 10" />
          <path d="M14 18h6" />
        </>
      ) : name === 'plus' ? (
        <>
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </>
      ) : name === 'minus' ? (
        <path d="M5 12h14" />
      ) : name === 'grip-vertical' ? (
        <>
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="19" r="1" />
        </>
      ) : name === 'upload' ? (
        <>
          <path d="M12 3v12" />
          <path d="m17 8-5-5-5 5" />
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        </>
      ) : name === 'copy' ? (
        <>
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </>
      ) : null}
    </svg>
  );
}
