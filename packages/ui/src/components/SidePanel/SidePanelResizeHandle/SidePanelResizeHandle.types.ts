import type { SidePanelPosition } from '../SidePanel.types';

export type SidePanelResizeHandleProps = {
  /** Names what is being resized; defaults to the panel's own noun. */
  readonly label?: string;
  readonly onWidthChange: (width: number) => void;
  readonly onWidthCommit?: (width: number) => void;
  /** Called when the splitter is double-clicked; clear the stored width to restore `size`. */
  readonly onWidthReset?: () => void;
  readonly position: SidePanelPosition;
  /** Absent until the reader has resized it: the panel paints from `size`. */
  readonly width?: number;
};
