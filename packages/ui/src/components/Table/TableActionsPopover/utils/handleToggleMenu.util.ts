import type { BoundsRect, MenuPosition } from '../TableActionsPopover.types';

import { MENU_REPOSITION_FRAMES } from '../TableActionsPopover.constants';
import { applyRepositionOutcome } from './applyRepositionOutcome.util';
import { getIsPopoverOpen } from './getIsPopoverOpen.util';
import { resolveOpenMenuReposition } from './resolveOpenMenuReposition.util';

type HandleToggleMenuArgs = {
  readonly closeMenu: () => void;
  readonly getContainerRect: () => BoundsRect;
  readonly getTriggerElement: () => HTMLElement | null;
  readonly menuElement: HTMLDivElement | null;
  readonly setIsMenuOpen: (isMenuOpen: boolean) => void;
  readonly setMenuPosition: (position: MenuPosition) => void;
};

export const handleToggleMenu = ({
  closeMenu,
  getContainerRect,
  getTriggerElement,
  menuElement,
  setIsMenuOpen,
  setMenuPosition,
}: HandleToggleMenuArgs) => {
  if (!menuElement) {
    return;
  }

  if (getIsPopoverOpen(menuElement)) {
    closeMenu();

    return;
  }

  setIsMenuOpen(true);
  menuElement.showPopover();

  let frameCount = 0;
  const stabilizePosition = () => {
    const didReposition = applyRepositionOutcome({
      closeMenu,
      outcome: resolveOpenMenuReposition({
        getContainerRect,
        menuElement,
        triggerElement: getTriggerElement(),
      }),
      setMenuPosition,
    });

    frameCount += 1;

    if (didReposition && frameCount < MENU_REPOSITION_FRAMES) {
      requestAnimationFrame(stabilizePosition);
    }
  };

  requestAnimationFrame(stabilizePosition);
};
