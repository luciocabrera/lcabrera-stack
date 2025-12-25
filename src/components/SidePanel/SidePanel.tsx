// component
import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef } from 'react';

import type { SidePanelProps } from './SidePanel.types';

import { sidePanelStyles } from './SidePanel.stylex';

export const SidePanel = ({
  children,
  isOpen,
  onClose,
  position = 'right',
  shouldShowOverlay = true,
  size = 'md',
  ...props
}: SidePanelProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

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
    } else {
      if (dialog.open) {
        dialog.close();
      }
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

  // Handle backdrop click when using showModal()
  // const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
  //   const dialog = dialogRef.current;
  //   if (!dialog || !onClose) return;

  //   // Check if click was on the backdrop (outside dialog content)
  //   const rect = dialog.getBoundingClientRect();
  //   const didClickOutside =
  //     e.clientX < rect.left ||
  //     e.clientX > rect.right ||
  //     e.clientY < rect.top ||
  //     e.clientY > rect.bottom;

  //   if (didClickOutside) {
  //     onClose();
  //   }
  // };

  return (
    <dialog
      data-testid="side-panel"
      // onClick={handleDialogClick}
      ref={dialogRef}
      {...props}
      {...stylex.props(
        sidePanelStyles.base,
        sidePanelStyles.size[size],
        sidePanelStyles.position[position],
        isOpen
          ? sidePanelStyles.position[position === 'left' ? 'leftOpen' : 'rightOpen']
          : sidePanelStyles.position[position === 'left' ? 'leftClosed' : 'rightClosed'],
        shouldShowOverlay ? sidePanelStyles.withBackdrop : sidePanelStyles.withoutBackdrop,
      )}
    >
      <div {...stylex.props(sidePanelStyles.content)}>{children}</div>
    </dialog>
  );
};