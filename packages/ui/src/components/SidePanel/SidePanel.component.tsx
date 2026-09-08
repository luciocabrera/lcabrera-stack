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
  resizeLabel,
  shouldShowOverlay = true,
  size = 'md',
  width,
  ...props
}: SidePanelProps) => {
  const surfaceProps = {
    position,
    resizeHandle:
      isResizable && onWidthChange ? (
        <SidePanelResizeHandle
          label={resizeLabel}
          onWidthChange={onWidthChange}
          onWidthCommit={onWidthCommit}
          position={position}
          width={width}
        />
      ) : undefined,
    size,
    ...(width !== undefined && { width }),
    ...props,
  };

  if (isPinned) {
    return (
      <PinnedSidePanel portalContainer={portalContainer} {...surfaceProps}>
        {children}
      </PinnedSidePanel>
    );
  }

  return (
    <DialogSidePanel
      isOpen={isOpen}
      onClose={onClose}
      shouldShowOverlay={shouldShowOverlay}
      {...surfaceProps}
    >
      {children}
    </DialogSidePanel>
  );
};
