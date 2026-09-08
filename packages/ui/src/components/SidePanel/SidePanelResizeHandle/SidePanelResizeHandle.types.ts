import type { SidePanelPosition } from '../SidePanel.types';

export type SidePanelResizeHandleProps = {
  readonly onWidthChange: (width: number) => void;
  readonly onWidthCommit?: (width: number) => void;
  readonly position: SidePanelPosition;
  readonly width: number;
};
