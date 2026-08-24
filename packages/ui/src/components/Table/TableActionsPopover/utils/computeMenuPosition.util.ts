import type { BoundsRect } from '../TableActionsPopover.types';

import {
  MENU_GAP_PX,
  MENU_HORIZONTAL_NUDGE_PX,
  MENU_VIEWPORT_PADDING_PX,
} from '../TableActionsPopover.constants';
import { getTableActionsPopoverPosition } from './getTableActionsPopoverPosition.util';

type ComputeMenuPositionArgs = {
  readonly containerRect: BoundsRect;
  readonly menuElement: HTMLDivElement;
  readonly triggerElement: HTMLElement;
};

export const computeMenuPosition = ({
  containerRect,
  menuElement,
  triggerElement,
}: ComputeMenuPositionArgs) => {
  const triggerRect = triggerElement.getBoundingClientRect();
  const triggerCellRect = triggerElement
    .closest('td, th')
    ?.getBoundingClientRect();
  const menuRect = menuElement.getBoundingClientRect();

  return getTableActionsPopoverPosition({
    containerRect,
    horizontalNudgePx: MENU_HORIZONTAL_NUDGE_PX,
    menuGapPx: MENU_GAP_PX,
    menuRect,
    triggerCellRight: triggerCellRect?.right,
    triggerRect,
    viewportPaddingPx: MENU_VIEWPORT_PADDING_PX,
  });
};
