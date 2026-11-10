import type { VirtualSelectPlacement } from '../../VirtualSelect.types';
import type {
  AnchorRect,
  DropdownPlacement,
} from '../VirtualSelectDropdown.types';

import { shouldOpenAbove } from './shouldOpenAbove.util';

type ResolveDropdownPlacementArgs = {
  readonly anchorRect: AnchorRect;
  readonly dropdownHeight: number;
  readonly gap: number;
  readonly minUsableHeight: number;
  readonly placement: VirtualSelectPlacement;
  readonly viewportHeight: number;
};

export const resolveDropdownPlacement = ({
  anchorRect,
  dropdownHeight,
  gap,
  minUsableHeight,
  placement,
  viewportHeight,
}: ResolveDropdownPlacementArgs): DropdownPlacement => {
  const spaceBelow = Math.max(0, viewportHeight - anchorRect.bottom - gap);
  const spaceAbove = Math.max(0, anchorRect.top - 2 * gap);

  if (
    shouldOpenAbove({
      dropdownHeight,
      minUsableHeight,
      placement,
      spaceAbove,
      spaceBelow,
    })
  ) {
    return {
      left: anchorRect.left,
      maxHeight: spaceAbove,
      side: 'above',
      top: anchorRect.top - gap - Math.min(dropdownHeight, spaceAbove),
      width: anchorRect.width,
    };
  }

  return {
    left: anchorRect.left,
    maxHeight: spaceBelow,
    side: 'below',
    top: anchorRect.bottom,
    width: anchorRect.width,
  };
};
