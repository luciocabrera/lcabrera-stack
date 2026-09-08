import type { SidePanelProps } from './SidePanel.types';

import { DialogSidePanel } from './DialogSidePanel/DialogSidePanel.component';
import { PinnedSidePanel } from './PinnedSidePanel/PinnedSidePanel.component';
import { SidePanelResizeHandle } from './SidePanelResizeHandle';

export const SidePanel = ({
  children,
  isOpen,
  isPinned,
  isResizable = false,
  onClose,
  onWidthChange,
  onWidthCommit,
  portalContainer,
  position = 'right',
  shouldShowOverlay = true,
  size = 'md',
  width,
  ...props
}: SidePanelProps) => {
  const resizeHandle =
    isResizable && onWidthChange ? (
      <SidePanelResizeHandle
        onWidthChange={onWidthChange}
        {...(onWidthCommit !== undefined && { onWidthCommit })}
        position={position}
        {...(width !== undefined && { width })}
      />
    ) : undefined;

  if (isPinned) {
    return (
      <PinnedSidePanel
        portalContainer={portalContainer}
        position={position}
        resizeHandle={resizeHandle}
        size={size}
        {...(width !== undefined && { width })}
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
      resizeHandle={resizeHandle}
      shouldShowOverlay={shouldShowOverlay}
      size={size}
      {...(width !== undefined && { width })}
      {...props}
    >
      {children}
    </DialogSidePanel>
  );
};
