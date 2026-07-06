import { Button } from '@repo/ui/components/Button';
import { EraserIcon, EyeIcon, FileTextIcon } from '@repo/ui/components/Icons';
import { NavLink } from '@repo/ui/components/NavLink';
import { TableActionButton } from '@repo/ui/components/Table/TableActionButton';
import * as stylex from '@stylexjs/stylex';
import { useId, useRef } from 'react';
import { useFetcher } from 'react-router';

import type { TableRowActionsMenuProps } from './TableRowActionsMenu.types';

import { useTableContainerRef } from '../contexts/TableWrapper';
import { resolveCrudRowId } from '../utils/resolveCrudRowId.util';
import { styles } from './TableRowActionsMenu.stylex';

const DEFAULT_TITLE_SINGULAR = 'Record';

export const TableRowActionsMenu = <TData extends Record<string, unknown>>({
  crud,
  customActions,
  isLoadingState = false,
  row,
  titleSingular,
}: TableRowActionsMenuProps<TData>) => {
  const containerRef = useTableContainerRef();
  const fetcher = useFetcher();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId().replaceAll(':', '');
  const triggerId = `${menuId}-trigger`;
  const resolvedTitleSingular = titleSingular ?? DEFAULT_TITLE_SINGULAR;

  const positionMenuToTrigger = () => {
    const menuElement = menuRef.current;
    const triggerElement = document.getElementById(triggerId);

    if (!menuElement || !triggerElement) {
      return;
    }

    const triggerRect = triggerElement.getBoundingClientRect();
    const triggerCellRect = triggerElement
      .closest('td')
      ?.getBoundingClientRect();
    const menuRect = menuElement.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() ?? {
      bottom: window.innerHeight,
      left: 0,
      right: window.innerWidth,
      top: 0,
    };

    const viewportPadding = 8;
    const menuGap = 4;
    const spaceBelow = containerRect.bottom - triggerRect.bottom;
    const spaceAbove = triggerRect.top - containerRect.top;
    const shouldOpenAbove =
      spaceBelow < menuRect.height + viewportPadding + menuGap &&
      spaceAbove > menuGap;

    const nextTop = shouldOpenAbove
      ? triggerRect.top - menuRect.height - menuGap
      : triggerRect.bottom + menuGap;

    const minTop = containerRect.top + viewportPadding;
    const maxTop = containerRect.bottom - menuRect.height - viewportPadding;
    const top = Math.min(maxTop, Math.max(minTop, nextTop));
    const anchorRight = triggerCellRect?.right ?? triggerRect.right;
    const alignedLeft = anchorRight - menuRect.width;
    const minLeft = containerRect.left + viewportPadding;
    const maxLeft = containerRect.right - menuRect.width - viewportPadding;
    const left = Math.min(maxLeft, Math.max(minLeft, alignedLeft));

    menuElement.style.margin = '0';
    menuElement.style.setProperty('backdrop-filter', 'none', 'important');
    menuElement.style.setProperty(
      'background-color',
      'rgb(15, 23, 42)',
      'important',
    );
    menuElement.style.left = `${left}px`;
    menuElement.style.setProperty('opacity', '1', 'important');
    menuElement.style.position = 'fixed';
    menuElement.style.top = `${top}px`;
  };

  const handleToggleMenu = () => {
    const menuElement = menuRef.current;

    if (!menuElement) {
      return;
    }

    if (menuElement.matches(':popover-open')) {
      menuElement.hidePopover();

      return;
    }

    menuElement.showPopover();
    requestAnimationFrame(positionMenuToTrigger);
  };

  if (isLoadingState) {
    return (
      <div {...stylex.props(styles.trigger)}>
        <TableActionButton isDisabled menuId={menuId} />
      </div>
    );
  }

  const rowId = resolveCrudRowId({ idAccessor: crud.idAccessor, row });

  const handleDelete = () => {
    if (!crud.deleteActionPath) return;

    const shouldDelete = window.confirm(
      `Are you sure you want to delete this ${resolvedTitleSingular.toLowerCase()}?`,
    );

    if (!shouldDelete) return;

    void fetcher.submit(
      {
        id: String(rowId),
        intent: 'delete',
      },
      {
        action: crud.deleteActionPath,
        method: 'post',
      },
    );

    menuRef.current?.hidePopover?.();
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
        popover='auto'
        ref={menuRef}
        {...stylex.props(styles.menu)}
      >
        <div {...stylex.props(styles.menuActions)}>
          {crud.read && (
            <NavLink
              color='ghost'
              icon={<EyeIcon size={16} />}
              orientation='horizontal'
              size='mini'
              to={`view/${String(rowId)}`}
              width='full'
            >
              {`View ${resolvedTitleSingular}`}
            </NavLink>
          )}
          {crud.update && (
            <NavLink
              color='ghost'
              icon={<FileTextIcon size={16} />}
              orientation='horizontal'
              size='mini'
              to={`edit/${String(rowId)}`}
              width='full'
            >
              {`Edit ${resolvedTitleSingular}`}
            </NavLink>
          )}
          {crud.delete && (
            <Button
              color='ghost'
              icon={<EraserIcon size={16} />}
              onClick={handleDelete}
              orientation='horizontal'
              size='mini'
              width='full'
            >
              {`Delete ${resolvedTitleSingular}`}
            </Button>
          )}
          {customActions && (
            <div {...stylex.props(styles.customActions)}>{customActions}</div>
          )}
        </div>
      </div>
    </div>
  );
};
