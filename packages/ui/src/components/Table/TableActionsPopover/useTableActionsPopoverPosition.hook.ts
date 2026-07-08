import type { RefObject } from 'react';

import { useEffect, useRef, useState } from 'react';

import type { MenuPosition } from './TableActionsPopover.types';

import { getTableActionsPopoverPosition } from './utils/getTableActionsPopoverPosition.util';

const MENU_GAP_PX = 4;
const MENU_HORIZONTAL_NUDGE_PX = 2;
const MENU_REPOSITION_FRAMES = 10;
const MENU_VIEWPORT_PADDING_PX = 8;

type BoundsRect = {
  readonly bottom: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly width: number;
};

const FALLBACK_CONTAINER_RECT: BoundsRect = {
  bottom: globalThis.innerHeight,
  height: globalThis.innerHeight,
  left: 0,
  right: globalThis.innerWidth,
  top: 0,
  width: globalThis.innerWidth,
};

type ComputeMenuPositionArgs = {
  readonly containerRect: BoundsRect;
  readonly menuElement: HTMLDivElement;
  readonly triggerElement: HTMLElement;
};

const computeMenuPosition = ({
  containerRect,
  menuElement,
  triggerElement,
}: ComputeMenuPositionArgs) => {
  const triggerRect = triggerElement.getBoundingClientRect();
  const triggerCellRect = triggerElement
    .closest('td, th')
    ?.getBoundingClientRect();
  const menuRect = menuElement.getBoundingClientRect();

  return getTableActionsPopoverPosition({
    containerRect,
    horizontalNudgePx: MENU_HORIZONTAL_NUDGE_PX,
    menuGapPx: MENU_GAP_PX,
    menuRect,
    triggerCellRight: triggerCellRect?.right,
    triggerRect,
    viewportPaddingPx: MENU_VIEWPORT_PADDING_PX,
  });
};

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
            FALLBACK_CONTAINER_RECT,
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
