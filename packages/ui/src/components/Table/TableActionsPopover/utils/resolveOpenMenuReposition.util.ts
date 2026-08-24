import type { BoundsRect } from '../TableActionsPopover.types';

import { computeMenuPosition } from './computeMenuPosition.util';
import { getIsPopoverOpen } from './getIsPopoverOpen.util';

type ResolveOpenMenuRepositionArgs = {
  readonly getContainerRect: () => BoundsRect;
  readonly menuElement: HTMLDivElement;
  readonly triggerElement: HTMLElement | null;
};

/**
 * Decision core shared by the observer and post-open stabilization reposition paths:
 * `keep` while the menu is not open, `close` when the trigger left the DOM (virtualization
 * can unmount it), otherwise `reposition` with freshly computed menu coordinates.
 */
export const resolveOpenMenuReposition = ({
  getContainerRect,
  menuElement,
  triggerElement,
}: ResolveOpenMenuRepositionArgs) => {
  if (!getIsPopoverOpen(menuElement)) {
    return { kind: 'keep' } as const;
  }

  if (!triggerElement?.isConnected) {
    return { kind: 'close' } as const;
  }

  return {
    kind: 'reposition',
    position: computeMenuPosition({
      containerRect: getContainerRect(),
      menuElement,
      triggerElement,
    }),
  } as const;
};

export type ResolveOpenMenuRepositionResult = ReturnType<
  typeof resolveOpenMenuReposition
>;
