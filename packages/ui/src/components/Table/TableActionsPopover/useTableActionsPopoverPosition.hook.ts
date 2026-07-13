import type { RefObject } from 'react';

import { useEffect, useRef, useState } from 'react';

import type { MenuPosition } from './TableActionsPopover.types';

import { MENU_REPOSITION_FRAMES } from './TableActionsPopover.constants';
import { createViewportRect } from './utils/createViewportRect.util';
import { getIsPopoverOpen } from './utils/getIsPopoverOpen.util';
import { resolveOpenMenuReposition } from './utils/resolveOpenMenuReposition.util';

type UseTableActionsPopoverPositionArgs = {
  readonly containerRef: RefObject<HTMLDivElement | null>;
  readonly isEnabled: boolean;
  readonly triggerId: string;
};

/**
 * Owns a table actions popover's open state and viewport-aware coordinates.
 * Repositioning is recomputed on resize/intersection while open, and across
 * several animation frames right after opening because virtualization/load-more
 * can shift trigger geometry immediately after the click. The keep/close/
 * reposition decision lives in resolveOpenMenuReposition; this hook applies
 * the outcome to state and the Popover API. Shared by TableRowActionsMenu
 * (row actions) and TableHeaderActionsMenu (column actions).
 */
export const useTableActionsPopoverPosition = ({
  containerRef,
  isEnabled,
  triggerId,
}: UseTableActionsPopoverPositionArgs) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>();

  const closeMenu = () => {
    setIsMenuOpen(false);
    setMenuPosition(undefined);
    menuRef.current?.hidePopover?.();
  };

  const applyRepositionOutcome = (
    outcome: ReturnType<typeof resolveOpenMenuReposition>,
  ) => {
    if (outcome.kind === 'close') {
      closeMenu();

      return false;
    }

    if (outcome.kind === 'reposition') {
      setMenuPosition(outcome.position);

      return true;
    }

    return false;
  };

  useEffect(() => {
    const menuElement = menuRef.current;
    const containerElement = containerRef.current;
    const triggerElement = document.getElementById(triggerId);

    if (!isEnabled || !menuElement || !containerElement || !triggerElement) {
      return;
    }

    const repositionWhenOpen = () => {
      applyRepositionOutcome(
        resolveOpenMenuReposition({
          getContainerRect: () => containerElement.getBoundingClientRect(),
          menuElement,
          triggerElement,
        }),
      );
    };

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(repositionWhenOpen);
    resizeObserver?.observe(containerElement);
    resizeObserver?.observe(menuElement);
    resizeObserver?.observe(triggerElement);

    const intersectionObserver =
      typeof IntersectionObserver === 'undefined'
        ? undefined
        : new IntersectionObserver(repositionWhenOpen, {
            root: containerElement,
            threshold: [0, 1],
          });
    intersectionObserver?.observe(triggerElement);

    return () => {
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-x/exhaustive-deps -- closeMenu/applyRepositionOutcome are stable per render and re-derived from refs, not reactive state
  }, [containerRef, isEnabled, triggerId]);

  const handleToggleMenu = () => {
    const menuElement = menuRef.current;

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
      const didReposition = applyRepositionOutcome(
        resolveOpenMenuReposition({
          getContainerRect: () =>
            containerRef.current?.getBoundingClientRect() ??
            // Read the window size at reposition time, not import time
            createViewportRect({
              height: globalThis.innerHeight,
              width: globalThis.innerWidth,
            }),
          menuElement,
          triggerElement: document.getElementById(triggerId),
        }),
      );

      frameCount += 1;

      if (didReposition && frameCount < MENU_REPOSITION_FRAMES) {
        requestAnimationFrame(stabilizePosition);
      }
    };

    requestAnimationFrame(stabilizePosition);
  };

  const handlePopoverToggle = () => {
    const menuElement = menuRef.current;

    if (!menuElement) {
      return;
    }

    const nextIsMenuOpen = getIsPopoverOpen(menuElement);
    setIsMenuOpen(nextIsMenuOpen);

    if (!nextIsMenuOpen) {
      setMenuPosition(undefined);
    }
  };

  return {
    closeMenu,
    handlePopoverToggle,
    handleToggleMenu,
    isMenuOpen,
    menuPosition,
    menuRef,
  };
};
