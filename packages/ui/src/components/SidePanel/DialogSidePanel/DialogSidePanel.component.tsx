import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef } from 'react';

import type { DialogSidePanelProps } from './DialogSidePanel.types';

import { sidePanelStyles } from '../SidePanel.stylex';
import { resolveSidePanelSurfaceStyles } from '../utils';

export const DialogSidePanel = ({
  children,
  isOpen,
  onClose,
  position,
  resizeHandle,
  shouldShowOverlay,
  size,
  width,
  ...props
}: DialogSidePanelProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const panelStyles = resolveSidePanelSurfaceStyles({
    isOpen,
    position,
    shouldShowOverlay,
    size,
    ...(width !== undefined && { width }),
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (shouldShowOverlay) {
        dialog.showModal();
      } else {
        dialog.show();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen, shouldShowOverlay]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      if (onClose) {
        onClose();
      }
    };

    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  return (
    <dialog
      data-testid='side-panel'
      ref={dialogRef}
      {...props}
      {...panelStyles}
    >
      {resizeHandle}
      <div {...stylex.props(sidePanelStyles.content)}>{children}</div>
    </dialog>
  );
};
