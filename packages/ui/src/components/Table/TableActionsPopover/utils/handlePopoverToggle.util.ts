import type { MenuPosition } from '../TableActionsPopover.types';

import { getIsPopoverOpen } from './getIsPopoverOpen.util';

type HandlePopoverToggleArgs = {
  readonly menuElement: HTMLDivElement | null;
  readonly setIsMenuOpen: (isMenuOpen: boolean) => void;
  readonly setMenuPosition: (position: MenuPosition | undefined) => void;
};

/**
 * Popover `toggle` event handler core: syncs React open state with the
 * Popover API's actual state (light dismiss, Escape, programmatic hides) and
 * clears the stored coordinates when the popover closed.
 */
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
