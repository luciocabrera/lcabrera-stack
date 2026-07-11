import type { SidePanelProps } from './SidePanel.types';

import { DialogSidePanel } from './DialogSidePanel/DialogSidePanel.component';
import { PinnedSidePanel } from './PinnedSidePanel/PinnedSidePanel.component';

/**
 * Slide-in panel with two render modes selected by `isPinned`:
 * - pinned → `PinnedSidePanel`: always-visible `<aside>` (optionally portaled),
 *   no backdrop, no effects
 * - not pinned → `DialogSidePanel`: native `<dialog>` owning the imperative
 *   open/close lifecycle and the ESC/close event forwarding
 */
export const SidePanel = ({
  children,
  isOpen,
  isPinned,
  onClose,
  portalContainer,
  position = 'right',
  shouldShowOverlay = true,
  size = 'md',
  ...props
}: SidePanelProps) => {
  if (isPinned) {
    return (
      <PinnedSidePanel
        portalContainer={portalContainer}
        position={position}
        size={size}
        {...props}
      >
        {children}
      </PinnedSidePanel>
    );
  }

  return (
    <DialogSidePanel
      isOpen={isOpen}
      onClose={onClose}
      position={position}
      shouldShowOverlay={shouldShowOverlay}
      size={size}
      {...props}
    >
      {children}
    </DialogSidePanel>
  );
};
