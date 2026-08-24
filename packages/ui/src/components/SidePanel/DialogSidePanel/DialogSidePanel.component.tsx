import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef } from 'react';

import { surfaceStyles } from '#ui/design-system/tokens/surfaces.stylex';

import type { DialogSidePanelProps } from './DialogSidePanel.types';

import { sidePanelStyles } from '../SidePanel.stylex';

/** Unmounting (e.g. */
export const DialogSidePanel = ({
  children,
  isOpen,
  onClose,
  position,
  shouldShowOverlay,
  size,
  ...props
}: DialogSidePanelProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openStyle =
    position === 'left' ? ('leftOpen' as const) : ('rightOpen' as const);
  const closedStyle =
    position === 'left' ? ('leftClosed' as const) : ('rightClosed' as const);
  const panelStyles = stylex.props(
    surfaceStyles.glassPanel,
    sidePanelStyles.base,
    sidePanelStyles.size[size],
    sidePanelStyles.position[position],
    sidePanelStyles.position[isOpen ? openStyle : closedStyle],
    shouldShowOverlay
      ? sidePanelStyles.withBackdrop
      : sidePanelStyles.withoutBackdrop,
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      // Use showModal() for backdrop support
      if (shouldShowOverlay) {
        dialog.showModal();
      } else {
        dialog.show();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen, shouldShowOverlay]);

  // Handle native dialog close event (ESC key)
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
      <div {...stylex.props(sidePanelStyles.content)}>{children}</div>
    </dialog>
  );
};
