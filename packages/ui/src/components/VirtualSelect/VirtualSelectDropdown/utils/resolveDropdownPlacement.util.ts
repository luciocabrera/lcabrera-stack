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
  const capFloor = placement === 'auto' ? 0 : minUsableHeight;
  const capAbove = Math.max(capFloor, spaceAbove);
  const capBelow = Math.max(capFloor, spaceBelow);

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
      maxHeight: capAbove,
      side: 'above',
      top: Math.max(
        gap,
        anchorRect.top - gap - Math.min(dropdownHeight, capAbove),
      ),
      width: anchorRect.width,
    };
  }

  return {
    left: anchorRect.left,
    maxHeight: capBelow,
    side: 'below',
    top: Math.max(
      gap,
      Math.min(
        anchorRect.bottom,
        viewportHeight - gap - Math.min(dropdownHeight, capBelow),
      ),
    ),
    width: anchorRect.width,
  };
};
