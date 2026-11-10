import type { VirtualSelectPlacement } from '../../VirtualSelect.types';

type ShouldOpenAboveArgs = {
  readonly dropdownHeight: number;
  readonly minUsableHeight: number;
  readonly placement: VirtualSelectPlacement;
  readonly spaceAbove: number;
  readonly spaceBelow: number;
};

export const shouldOpenAbove = ({
  dropdownHeight,
  minUsableHeight,
  placement,
  spaceAbove,
  spaceBelow,
}: ShouldOpenAboveArgs) => {
  if (placement !== 'auto') return placement === 'top';

  return (
    dropdownHeight > spaceBelow &&
    spaceBelow < minUsableHeight &&
    spaceAbove > spaceBelow
  );
};
