import type {
  AnchorRect,
  DropdownPlacement,
} from '../VirtualSelectDropdown.types';

type ResolveDropdownPlacementArgs = {
  readonly anchorRect: AnchorRect;
  readonly dropdownHeight: number;
  readonly gap: number;
  readonly viewportHeight: number;
};

export const resolveDropdownPlacement = ({
  anchorRect,
  dropdownHeight,
  gap,
  viewportHeight,
}: ResolveDropdownPlacementArgs): DropdownPlacement => {
  const spaceBelow = viewportHeight - anchorRect.bottom - gap;
  const spaceAbove = anchorRect.top - gap;
  const shouldFlip = dropdownHeight > spaceBelow && spaceAbove > spaceBelow;

  return {
    left: anchorRect.left,
    top: shouldFlip
      ? Math.max(gap, anchorRect.top - gap - dropdownHeight)
      : anchorRect.bottom + gap,
    width: anchorRect.width,
  };
};
