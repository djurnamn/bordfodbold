import type { ReactNode, ComponentPropsWithRef } from 'react';
import { useBem } from 'use-bem/react';
import { componentDefault } from './scripts';
import './ModalVisual.scss';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

interface ModalVisualProps extends ComponentPropsWithRef<'div'> {
  fillHeight?: boolean;
  width?: string;
  surface?: number;
  closeButton?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}

export function ModalVisual(props: ModalVisualProps) {
  const { fillHeight, width, surface, closeButton, children, actions, className, style, ref, ...rest } = props;

  const bem = useBem('DjuiModal');

  return (
    <div
      {...rest}
      data-djui-next-surface=""
      data-djui-set-surface={surface ?? componentDefault('Modal', 'surface') ?? componentDefault('component-group-overlay', 'surface')}
      style={{ '--djui-component-modal--width-resolved': typeof (width ?? componentDefault('Modal', 'width')) === 'string' && (width ?? componentDefault('Modal', 'width')) !== 'xsmall' && (width ?? componentDefault('Modal', 'width')) !== 'small' && (width ?? componentDefault('Modal', 'width')) !== 'medium' && (width ?? componentDefault('Modal', 'width')) !== 'large' && (width ?? componentDefault('Modal', 'width')) !== 'xlarge' ? (width ?? componentDefault('Modal', 'width')) : undefined, ...style }}
      className={bem(undefined, { 'fill-height': fillHeight === true, 'width-xsmall': (width ?? componentDefault('Modal', 'width')) === 'xsmall', 'width-small': (width ?? componentDefault('Modal', 'width')) === 'small', 'width-medium': (width ?? componentDefault('Modal', 'width')) === 'medium', 'width-large': (width ?? componentDefault('Modal', 'width')) === 'large', 'width-xlarge': (width ?? componentDefault('Modal', 'width')) === 'xlarge' }) + (className ? ' ' + className : '')}
      ref={ref}
    >
      <div className="DjuiModal__close-button">
        {props.closeButton}
      </div>
      <div className="DjuiModal__inner">
        <div className="DjuiModal__content">
          {props.children}
        </div>
      </div>
      <div className="DjuiModal__actions">
        {props.actions}
      </div>
    </div>
  );
}
