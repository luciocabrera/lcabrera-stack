import type { SidePanelPosition } from '../SidePanel.types';

export type SidePanelResizeHandleProps = {
  readonly onWidthChange: (width: number) => void;
  readonly onWidthCommit?: (width: number) => void;
  readonly position: SidePanelPosition;
  /** Absent until the reader has resized it: the panel paints from `size`. */
  readonly width?: number;
};
