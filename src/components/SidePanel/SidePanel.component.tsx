import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef } from 'react';

import type { SidePanelProps } from './SidePanel.types';

import { sidePanelStyles } from './SidePanel.stylex';

export const SidePanel = ({
  children,
  isOpen,
  isPinned,
  onClose,
  position = 'right',
  shouldShowOverlay = true,
  size = 'md',
  ...props
}: SidePanelProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const shouldShowBackdrop = shouldShowOverlay && !isPinned;

  useEffect(() => {
    if (isPinned) return; // Skip dialog management when pinned

    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      // Use showModal() for backdrop support
      if (shouldShowBackdrop) {
        dialog.showModal();
      } else {
        dialog.show();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen, isPinned, shouldShowBackdrop]);

  // Handle native dialog close event (ESC key)
  useEffect(() => {
    if (isPinned) return; // Skip when pinned

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
  }, [onClose, isPinned]);

  const panelStyles = stylex.props(
    sidePanelStyles.base,
    sidePanelStyles.size[size],
    sidePanelStyles.position[position],
    isOpen || isPinned
      ? sidePanelStyles.position[position === 'left' ? 'leftOpen' : 'rightOpen']
      : sidePanelStyles.position[
          position === 'left' ? 'leftClosed' : 'rightClosed'
        ],
    shouldShowBackdrop
      ? sidePanelStyles.withBackdrop
      : sidePanelStyles.withoutBackdrop,
    isPinned && sidePanelStyles.pinned,
  );

  const content = (
    <div {...stylex.props(sidePanelStyles.content)}>{children}</div>
  );

  // When pinned, render as an aside instead of dialog
  if (isPinned) {
    return (
      <aside
        aria-label='Settings panel'
        aria-modal='false'
        data-testid='side-panel'
        role='complementary'
        {...props}
        {...panelStyles}
      >
        {content}
      </aside>
    );
  }

  // When not pinned, use dialog element
  return (
    <dialog
      data-testid='side-panel'
      ref={dialogRef}
      {...props}
      {...panelStyles}
    >
      {content}
    </dialog>
  );
};
