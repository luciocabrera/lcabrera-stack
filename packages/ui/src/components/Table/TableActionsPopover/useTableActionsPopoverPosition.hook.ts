import type { RefObject } from 'react';

import { useEffect, useRef, useState } from 'react';

import type { MenuPosition } from './TableActionsPopover.types';

import { applyRepositionOutcome } from './utils/applyRepositionOutcome.util';
import { createViewportRect } from './utils/createViewportRect.util';
import { handlePopoverToggle } from './utils/handlePopoverToggle.util';
import { handleToggleMenu } from './utils/handleToggleMenu.util';
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
 * reposition decision lives in resolveOpenMenuReposition and is applied by
 * applyRepositionOutcome; this hook owns state, observers, and the
 * environment reads (trigger lookup, viewport size) injected into the
 * handleToggleMenu/handlePopoverToggle handler cores. Shared by
 * TableRowActionsMenu (row actions) and TableHeaderActionsMenu (column
 * actions).
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
      applyRepositionOutcome({
        closeMenu,
        outcome: resolveOpenMenuReposition({
          getContainerRect: () => containerElement.getBoundingClientRect(),
          menuElement,
          triggerElement,
        }),
        setMenuPosition,
      });
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
  }, [containerRef, isEnabled, triggerId]);

  return {
    closeMenu,
    handlePopoverToggle: () => {
      handlePopoverToggle({
        menuElement: menuRef.current,
        setIsMenuOpen,
        setMenuPosition,
      });
    },
    handleToggleMenu: () => {
      handleToggleMenu({
        closeMenu,
        getContainerRect: () =>
          containerRef.current?.getBoundingClientRect() ??
          // Read the window size at reposition time, not import time
          createViewportRect({
            height: globalThis.innerHeight,
            width: globalThis.innerWidth,
          }),
        getTriggerElement: () => document.getElementById(triggerId),
        menuElement: menuRef.current,
        setIsMenuOpen,
        setMenuPosition,
      });
    },
    isMenuOpen,
    menuPosition,
    menuRef,
  };
};
