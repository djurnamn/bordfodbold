import type { ReactNode } from 'react';
import { Portal } from '@zag-js/react';
import { DialogDriver } from './DialogDriver';
import { DrawerRoot } from './DrawerRoot';
import { DrawerVisual } from './DrawerVisual';
import { Icon } from './Icon';
import { resolveDrawerTranslations, type DrawerTranslations } from './scripts';

interface DrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'left' | 'right' | 'top' | 'bottom';
  contained?: boolean;
  label?: string;
  modal?: boolean;
  closeOnEscape?: boolean;
  closeOnInteractOutside?: boolean;
  initialFocus?: () => HTMLElement | null;
  role?: 'dialog' | 'alertdialog';
  translations?: DrawerTranslations;
  surface?: number;
  trigger?: (scope: { triggerProps: Record<string, unknown> }) => ReactNode;
  children?: ReactNode;
  closeIcon?: ReactNode;
}

export function Drawer(props: DrawerProps) {
  const { open, defaultOpen, onOpenChange, side, contained, label, modal, closeOnEscape, closeOnInteractOutside, initialFocus, role, translations, surface } = props;

  return (
    <DialogDriver
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      label={label}
      modal={contained ? false : modal}
      preventScroll={contained ? false : undefined}
      closeOnEscape={closeOnEscape}
      closeOnInteractOutside={closeOnInteractOutside}
      initialFocus={initialFocus}
      role={role}
    >
      {({ api }) => (
        <>
          {props.trigger?.({ triggerProps: api.getTriggerProps() })}
          {api.open && (
            <>
              {contained ? (
                <div>
                  <DrawerRoot
                    backdropProps={api.getBackdropProps()}
                    positionerProps={api.getPositionerProps()}
                    side={side}
                    contained={contained}
                  >
                    <DrawerVisual
                      {...api.getContentProps()}
                      side={side}
                      surface={surface}
                      closeButton={
                        <button
                          {...api.getCloseTriggerProps()}
                          aria-label={resolveDrawerTranslations(translations).closeLabel}
                        >
                          {props.closeIcon ?? <Icon name="x" size={0.75} />}
                        </button>
                      }
                    >
                      {props.children}
                    </DrawerVisual>
                  </DrawerRoot>
                </div>
              ) : (
                <Portal>
                  <DrawerRoot
                    backdropProps={api.getBackdropProps()}
                    positionerProps={api.getPositionerProps()}
                    side={side}
                  >
                    <DrawerVisual
                      {...api.getContentProps()}
                      side={side}
                      surface={surface}
                      closeButton={
                        <button
                          {...api.getCloseTriggerProps()}
                          aria-label={resolveDrawerTranslations(translations).closeLabel}
                        >
                          {props.closeIcon ?? <Icon name="x" size={0.75} />}
                        </button>
                      }
                    >
                      {props.children}
                    </DrawerVisual>
                  </DrawerRoot>
                </Portal>
              )}
            </>
          )}
        </>
      )}
    </DialogDriver>
  );
}
