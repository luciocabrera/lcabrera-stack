import {
  SIDE_PANEL_MAX_WIDTH_RATIO,
  SIDE_PANEL_MIN_WIDTH,
} from '../SidePanel.constants';

type ResolveSidePanelWidthBoundsArgs = {
  readonly viewportWidth: number;
};

export const resolveSidePanelWidthBounds = ({
  viewportWidth,
}: ResolveSidePanelWidthBoundsArgs) => {
  const ceiling = viewportWidth * SIDE_PANEL_MAX_WIDTH_RATIO;

  return {
    maxWidth: Math.max(SIDE_PANEL_MIN_WIDTH, ceiling),
    minWidth: SIDE_PANEL_MIN_WIDTH,
  };
};
