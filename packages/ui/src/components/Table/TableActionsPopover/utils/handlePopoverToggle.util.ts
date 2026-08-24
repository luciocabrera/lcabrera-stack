import type { MenuPosition } from '../TableActionsPopover.types';

import { getIsPopoverOpen } from './getIsPopoverOpen.util';

type HandlePopoverToggleArgs = {
  readonly menuElement: HTMLDivElement | null;
  readonly setIsMenuOpen: (isMenuOpen: boolean) => void;
  readonly setMenuPosition: (position: MenuPosition | undefined) => void;
};

export const handlePopoverToggle = ({
  menuElement,
  setIsMenuOpen,
  setMenuPosition,
}: HandlePopoverToggleArgs) => {
  if (!menuElement) {
    return;
  }

  const nextIsMenuOpen = getIsPopoverOpen(menuElement);
  setIsMenuOpen(nextIsMenuOpen);

  if (!nextIsMenuOpen) {
    setMenuPosition(undefined);
  }
};
