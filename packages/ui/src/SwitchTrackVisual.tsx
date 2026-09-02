import type { ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import './SwitchTrackVisual.scss';

interface SwitchTrackVisualProps extends ComponentPropsWithRef<'span'> {
  checked?: boolean;
  neutral?: boolean;
}

export function SwitchTrackVisual(props: SwitchTrackVisualProps) {
  const { checked, neutral, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiSwitchTrack');

  return (
    <span
      {...rest}
      aria-hidden="true"
      style={style}
      className={bem(undefined, { checked: checked === true, neutral: neutral === true }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      <span className="DjuiSwitchTrack__thumb" />
    </span>
  );
}
