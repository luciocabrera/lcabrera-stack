import type { SidePanelPosition } from '../SidePanel.types';

type ResolveSidePanelResizeWidthArgs = {
  readonly clientX: number;
  readonly initialWidth: number;
  readonly initialX: number;
  readonly maxWidth: number;
  readonly minWidth: number;
  readonly position: SidePanelPosition;
};

export const resolveSidePanelResizeWidth = ({
  clientX,
  initialWidth,
  initialX,
  maxWidth,
  minWidth,
  position,
}: ResolveSidePanelResizeWidthArgs) => {
  const travel = clientX - initialX;
  const grown =
    position === 'right' ? initialWidth - travel : initialWidth + travel;

  return Math.max(minWidth, Math.min(maxWidth, grown));
};
