import * as stylex from '@stylexjs/stylex';

import { surfaceStyles } from '#ui/design-system/tokens/surfaces.stylex';

import type { SidePanelPosition, SidePanelSize } from '../SidePanel.types';

import { sidePanelStyles } from '../SidePanel.stylex';

type ResolveSidePanelSurfaceStylesArgs = {
  readonly isOpen: boolean;
  readonly isPinned?: boolean;
  readonly position: SidePanelPosition;
  readonly shouldShowOverlay: boolean;
  readonly size: SidePanelSize;
  readonly width?: number;
};

export const resolveSidePanelSurfaceStyles = ({
  isOpen,
  isPinned = false,
  position,
  shouldShowOverlay,
  size,
  width,
}: ResolveSidePanelSurfaceStylesArgs) => {
  const openStyle = position === 'left' ? 'leftOpen' : 'rightOpen';
  const closedStyle = position === 'left' ? 'leftClosed' : 'rightClosed';

  return stylex.props(
    surfaceStyles.glassPanel,
    sidePanelStyles.base,
    sidePanelStyles.size[size],
    width !== undefined && sidePanelStyles.width.resized(width),
    sidePanelStyles.position[position],
    sidePanelStyles.position[isOpen ? openStyle : closedStyle],
    shouldShowOverlay
      ? sidePanelStyles.withBackdrop
      : sidePanelStyles.withoutBackdrop,
    isPinned && sidePanelStyles.pinned,
  );
};
