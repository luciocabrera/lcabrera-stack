import type { RefObject } from 'react';

import { useEffect, useRef, useState } from 'react';

import type { MenuPosition } from './TableActionsPopover.types';

import { MENU_REPOSITION_FRAMES } from './TableActionsPopover.constants';
import { computeMenuPosition } from './utils/computeMenuPosition.util';
import { createViewportRect } from './utils/createViewportRect.util';

type UseTableActionsPopoverPositionArgs = {
  readonly containerRef: RefObject<HTMLDivElement | null>;
  readonly isEnabled: boolean;
  readonly triggerId: string;
};

/**
 * Owns a table actions popover's open state and viewport-aware coordinates.
 * Repositioning is recomputed on resize/intersection while open, and across
 * several animation frames right after opening because virtualization/load-more
 * can shift trigger geometry immediately after the click. Shared by
 * TableRowActionsMenu (row actions) and TableHeaderActionsMenu (column actions).
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

  useEffect(() => {
    const menuElement = menuRef.current;
    const containerElement = containerRef.current;
    const triggerElement = document.getElementById(triggerId);

    if (!isEnabled || !menuElement || !containerElement || !triggerElement) {
      return;
    }

    const repositionWhenOpen = () => {
      if (!menuElement.matches(':popover-open')) {
        return;
      }

      if (!triggerElement.isConnected) {
        closeMenu();

        return;
      }

      setMenuPosition(
        computeMenuPosition({
          containerRect: containerElement.getBoundingClientRect(),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- closeMenu is stable per render and re-derived from refs, not reactive state
  }, [containerRef, isEnabled, triggerId]);

  const handleToggleMenu = () => {
    const menuElement = menuRef.current;

    if (!menuElement) {
      return;
    }

    if (menuElement.matches(':popover-open')) {
      closeMenu();

      return;
    }

    setIsMenuOpen(true);
    menuElement.showPopover();

    let frameCount = 0;
    const stabilizePosition = () => {
      if (!menuElement.matches(':popover-open')) {
        return;
      }

      const triggerElement = document.getElementById(triggerId);

      if (!triggerElement || !triggerElement.isConnected) {
        closeMenu();

        return;
      }

      setMenuPosition(
        computeMenuPosition({
          containerRect:
            containerRef.current?.getBoundingClientRect() ??
            // Read the window size at reposition time, not import time
            createViewportRect({
              height: globalThis.innerHeight,
              width: globalThis.innerWidth,
            }),
          menuElement,
          triggerElement,
        }),
      );

      frameCount += 1;

      if (frameCount < MENU_REPOSITION_FRAMES) {
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

    const nextIsMenuOpen = menuElement.matches(':popover-open');
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
