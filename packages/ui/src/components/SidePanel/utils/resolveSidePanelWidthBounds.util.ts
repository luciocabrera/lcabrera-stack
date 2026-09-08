import {
  SIDE_PANEL_MAX_WIDTH_RATIO,
  SIDE_PANEL_MIN_WIDTH,
} from '../SidePanel.constants';

type ResolveSidePanelWidthBoundsArgs = {
  readonly currentWidth?: number;
  readonly viewportWidth: number;
};

export const resolveSidePanelWidthBounds = ({
  currentWidth = 0,
  viewportWidth,
}: ResolveSidePanelWidthBoundsArgs) => {
  const ceiling = viewportWidth * SIDE_PANEL_MAX_WIDTH_RATIO;

  return {
    maxWidth: Math.max(SIDE_PANEL_MIN_WIDTH, ceiling, currentWidth),
    minWidth: SIDE_PANEL_MIN_WIDTH,
  };
};
