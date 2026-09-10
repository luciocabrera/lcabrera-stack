import type { SidePanelPosition } from '../SidePanel.types';

import {
  SIDE_PANEL_RESIZE_KEYBOARD_COARSE_STEP,
  SIDE_PANEL_RESIZE_KEYBOARD_STEP,
} from '../SidePanel.constants';

type ResolveSidePanelKeyboardResizeActionArgs = {
  readonly currentWidth: number;
  readonly isShiftPressed: boolean;
  readonly key: string;
  readonly maxWidth: number;
  readonly minWidth: number;
  readonly position: SidePanelPosition;
};

type SidePanelResizeAction =
  | { readonly type: 'ignore' }
  | { readonly type: 'reset' }
  | { readonly type: 'resize'; readonly width: number };

export const resolveSidePanelKeyboardResizeAction = ({
  currentWidth,
  isShiftPressed,
  key,
  maxWidth,
  minWidth,
  position,
}: ResolveSidePanelKeyboardResizeActionArgs): SidePanelResizeAction => {
  if (key === 'Enter') {
    return { type: 'reset' };
  }

  if (key === 'Home') {
    return { type: 'resize', width: minWidth };
  }

  if (key === 'End') {
    return { type: 'resize', width: maxWidth };
  }

  if (key !== 'ArrowLeft' && key !== 'ArrowRight') {
    return { type: 'ignore' };
  }

  const step = isShiftPressed
    ? SIDE_PANEL_RESIZE_KEYBOARD_COARSE_STEP
    : SIDE_PANEL_RESIZE_KEYBOARD_STEP;
  const isTowardsStart = key === 'ArrowLeft';
  const isGrowing = position === 'right' ? isTowardsStart : !isTowardsStart;
  const width = isGrowing ? currentWidth + step : currentWidth - step;

  return {
    type: 'resize',
    width: Math.max(minWidth, Math.min(maxWidth, width)),
  };
};
