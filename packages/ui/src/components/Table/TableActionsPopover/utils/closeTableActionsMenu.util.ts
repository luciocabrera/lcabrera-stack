import type { RefObject } from 'react';

import type { MenuPosition } from '../TableActionsPopover.types';

type CloseTableActionsMenuArgs = {
  readonly menuRef: RefObject<HTMLDivElement | null>;
  readonly setIsMenuOpen: (isMenuOpen: boolean) => void;
  readonly setMenuPosition: (position: MenuPosition | undefined) => void;
};

export const closeTableActionsMenu = ({
  menuRef,
  setIsMenuOpen,
  setMenuPosition,
}: CloseTableActionsMenuArgs) => {
  setIsMenuOpen(false);
  setMenuPosition(undefined);
  menuRef.current?.hidePopover?.();
};
