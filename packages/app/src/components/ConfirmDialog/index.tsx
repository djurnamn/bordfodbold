"use client";

import { Button, Modal } from "@bordfodbold/ui";
import type { ReactNode } from "react";
import { createBem } from "use-bem";
import "./styles.scss";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A question with two answers. Escape and the backdrop mean no. */
const cancelId = "confirm-dialog-cancel";

export function ConfirmDialog({ open, title, children, confirmLabel, destructive = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const bem = createBem("ConfirmDialog");
  return (
    <Modal
      open={open}
      onClose={onCancel}
      label={title}
      role="alertdialog"
      width="small"
      initialFocus={() => document.getElementById(cancelId)}
      actions={
        <>
          <Button id={cancelId} label="Cancel" variant="plain" onClick={onCancel} />
          <Button label={confirmLabel} variant="solid" color={destructive ? "context-negative" : undefined} onClick={onConfirm} />
        </>
      }
    >
      <div className={bem()}>
        <h2 className={bem("title")}>{title}</h2>
        <div className={bem("body")}>{children}</div>
      </div>
    </Modal>
  );
}
