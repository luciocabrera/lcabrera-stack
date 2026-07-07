import { TableActionButton } from '@repo/ui/components/Table/TableActionButton';
import * as stylex from '@stylexjs/stylex';
import { useEffect, useId, useRef, useState } from 'react';
import { useFetcher } from 'react-router';

import type {
  MenuPosition,
  TableRowActionsMenuProps,
} from './TableRowActionsMenu.types';

import { useGetColumns } from '../contexts/TableConfig/columns/selectors';
import {
  useGetTableCrud,
  useGetTableDeleteActionPath,
  useGetTableTitleSingular,
} from '../contexts/TableConfig/meta/selectors';
import { useTableContainerRef } from '../contexts/TableWrapper';
import { resolveCrudRowId } from '../utils/resolveCrudRowId.util';
import { TableActionMenu } from './TableActionMenu';
import { styles } from './TableRowActionsMenu.stylex';
import { getTableRowActionsMenuPosition } from './utils/getTableRowActionsMenuPosition.util';

const DEFAULT_TITLE_SINGULAR = 'Record';
const MENU_GAP_PX = 4;
const MENU_HORIZONTAL_NUDGE_PX = 2;
const MENU_REPOSITION_FRAMES = 10;
const MENU_VIEWPORT_PADDING_PX = 8;

export const TableRowActionsMenu = <TData extends Record<string, unknown>>({
  customActions,
  isLoadingState = false,
  row,
}: TableRowActionsMenuProps<TData>) => {
  const crud = useGetTableCrud();
  const columns = useGetColumns<TData>();
  const containerRef = useTableContainerRef();
  const deleteActionPath = useGetTableDeleteActionPath();
  const fetcher = useFetcher();
  const titleSingular = useGetTableTitleSingular();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId().replaceAll(':', '');
  const [menuPosition, setMenuPosition] = useState<MenuPosition>();
  const triggerId = `${menuId}-trigger`;

  useEffect(() => {
    const menuElement = menuRef.current;
    const containerElement = containerRef.current;
    const triggerElement = document.getElementById(triggerId);

    if (!crud || !menuElement || !containerElement || !triggerElement) {
      return;
    }

    const repositionWhenOpen = () => {
      if (!menuElement.matches(':popover-open')) {
        return;
      }

      if (!triggerElement || !triggerElement.isConnected) {
        setIsMenuOpen(false);
        setMenuPosition(undefined);
        menuElement.hidePopover();

        return;
      }

      const triggerRect = triggerElement.getBoundingClientRect();
      const triggerCellRect = triggerElement
        .closest('td')
        ?.getBoundingClientRect();
      const menuRect = menuElement.getBoundingClientRect();
      const containerRect = containerElement.getBoundingClientRect();

      setMenuPosition(
        getTableRowActionsMenuPosition({
          containerRect,
          horizontalNudgePx: MENU_HORIZONTAL_NUDGE_PX,
          menuGapPx: MENU_GAP_PX,
          menuRect,
          triggerCellRight: triggerCellRect?.right,
          triggerRect,
          viewportPaddingPx: MENU_VIEWPORT_PADDING_PX,
        }),
      );
    };

    const resizeObserver = new ResizeObserver(repositionWhenOpen);
    resizeObserver.observe(containerElement);
    resizeObserver.observe(menuElement);
    resizeObserver.observe(triggerElement);

    const intersectionObserver = new IntersectionObserver(repositionWhenOpen, {
      root: containerElement,
      threshold: [0, 1],
    });
    intersectionObserver.observe(triggerElement);

    return () => {
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [containerRef, crud, triggerId]);

  if (!crud) {
    return customActions;
  }

  if (isLoadingState) {
    return (
      <div {...stylex.props(styles.trigger)}>
        <TableActionButton isDisabled menuId={menuId} />
      </div>
    );
  }

  const resolvedTitleSingular = titleSingular ?? DEFAULT_TITLE_SINGULAR;
  const rowId = resolveCrudRowId({ columns, row });

  const handleToggleMenu = () => {
    const menuElement = menuRef.current;

    if (!menuElement) {
      return;
    }

    if (menuElement.matches(':popover-open')) {
      setIsMenuOpen(false);
      setMenuPosition(undefined);
      menuElement.hidePopover();

      return;
    }

    setIsMenuOpen(true);
    menuElement.showPopover();

    // Reposition across several frames because virtualization/load-more can
    // shift row geometry immediately after the click.
    let frameCount = 0;
    const stabilizePosition = () => {
      if (!menuElement.matches(':popover-open')) {
        return;
      }

      const triggerElement = document.getElementById(triggerId);

      if (!triggerElement || !triggerElement.isConnected) {
        setIsMenuOpen(false);
        setMenuPosition(undefined);
        menuElement.hidePopover();

        return;
      }

      const triggerRect = triggerElement.getBoundingClientRect();
      const triggerCellRect = triggerElement
        .closest('td')
        ?.getBoundingClientRect();
      const menuRect = menuElement.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect() ?? {
        bottom: globalThis.innerHeight,
        height: globalThis.innerHeight,
        left: 0,
        right: globalThis.innerWidth,
        top: 0,
        width: globalThis.innerWidth,
      };

      setMenuPosition(
        getTableRowActionsMenuPosition({
          containerRect,
          horizontalNudgePx: MENU_HORIZONTAL_NUDGE_PX,
          menuGapPx: MENU_GAP_PX,
          menuRect,
          triggerCellRight: triggerCellRect?.right,
          triggerRect,
          viewportPaddingPx: MENU_VIEWPORT_PADDING_PX,
        }),
      );

      frameCount += 1;

      if (frameCount < MENU_REPOSITION_FRAMES) {
        requestAnimationFrame(stabilizePosition);
      }
    };

    requestAnimationFrame(stabilizePosition);
  };

  const handleDelete = () => {
    if (!deleteActionPath) return;

    const shouldDelete = globalThis.confirm(
      `Are you sure you want to delete this ${resolvedTitleSingular.toLowerCase()}?`,
    );

    if (!shouldDelete) return;

    void fetcher.submit(
      {
        id: String(rowId),
        intent: 'delete',
      },
      {
        action: deleteActionPath,
        method: 'post',
      },
    );

    setIsMenuOpen(false);
    setMenuPosition(undefined);
    menuRef.current?.hidePopover?.();
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

  return (
    <div {...stylex.props(styles.trigger)}>
      <TableActionButton
        menuId={menuId}
        onClick={handleToggleMenu}
        triggerId={triggerId}
      />
      <div
        id={menuId}
        onToggle={handlePopoverToggle}
        popover='auto'
        ref={menuRef}
        {...stylex.props(
          styles.menu,
          menuPosition
            ? styles.menuPosition(menuPosition.left, menuPosition.top)
            : styles.menuHidden,
        )}
      >
        {isMenuOpen && (
          <TableActionMenu
            crud={crud}
            customActions={customActions}
            onDelete={handleDelete}
            resolvedTitleSingular={resolvedTitleSingular}
            rowId={rowId}
          />
        )}
      </div>
    </div>
  );
};
