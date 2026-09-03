import type { ReactNode } from 'react';
import { Portal } from '@zag-js/react';
import { DialogDriver } from './DialogDriver';
import { ModalRoot } from './ModalRoot';
import { ModalVisual } from './ModalVisual';
import { Icon } from './Icon';
import { resolveModalTranslations, type ModalTranslations } from './scripts';

interface ModalProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  label?: string;
  modal?: boolean;
  closeOnEscape?: boolean;
  closeOnInteractOutside?: boolean;
  initialFocus?: () => HTMLElement | null;
  translations?: ModalTranslations;
  fillHeight?: boolean;
  placement?: 'top' | 'center';
  width?: string;
  role?: 'dialog' | 'alertdialog';
  surface?: number;
  trigger?: (scope: { triggerProps: Record<string, unknown> }) => ReactNode;
  children?: ReactNode;
  closeIcon?: ReactNode;
  actions?: ReactNode;
}

export function Modal(props: ModalProps) {
  const { open, defaultOpen, onOpenChange, onClose, label, modal, closeOnEscape, closeOnInteractOutside, initialFocus, translations, fillHeight, placement, width, role, surface } = props;

  return (
    <DialogDriver
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(next) => { onOpenChange?.(next); if (!next) onClose?.(); }}
      label={label}
      modal={modal}
      closeOnEscape={closeOnEscape}
      closeOnInteractOutside={closeOnInteractOutside}
      initialFocus={initialFocus}
      role={role}
    >
      {({ api }) => (
        <>
          {props.trigger?.({ triggerProps: api.getTriggerProps() })}
          {api.open && (
            <Portal>
              <ModalRoot
                backdropProps={api.getBackdropProps()}
                positionerProps={api.getPositionerProps()}
                placement={placement}
              >
                <ModalVisual
                  {...api.getContentProps()}
                  fillHeight={fillHeight}
                  width={width}
                  surface={surface}
                  closeButton={
                    <button
                      {...api.getCloseTriggerProps()}
                      aria-label={resolveModalTranslations(translations).closeLabel}
                    >
                      {props.closeIcon ?? <Icon name="x" size={0.75} />}
                    </button>
                  }
                  actions={
                    <>
                      {props.actions}
                    </>
                  }
                >
                  {props.children}
                </ModalVisual>
              </ModalRoot>
            </Portal>
          )}
        </>
      )}
    </DialogDriver>
  );
}
