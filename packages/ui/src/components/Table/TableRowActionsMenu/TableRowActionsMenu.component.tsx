import { Button } from '@repo/ui/components/Button';
import { EraserIcon, EyeIcon, FileTextIcon } from '@repo/ui/components/Icons';
import { NavLink } from '@repo/ui/components/NavLink';
import { TableActionButton } from '@repo/ui/components/Table/TableActionButton';
import * as stylex from '@stylexjs/stylex';
import { useId, useRef } from 'react';
import { useFetcher } from 'react-router';

import type { TableRowActionsMenuProps } from './TableRowActionsMenu.types';

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
    const menuRect = menuElement.getBoundingClientRect();

    const viewportPadding = 8;
    const top = triggerRect.bottom + 4;
    const alignedLeft = triggerRect.right - menuRect.width;
    const maxLeft = window.innerWidth - menuRect.width - viewportPadding;
    const left = Math.min(maxLeft, Math.max(viewportPadding, alignedLeft));

    menuElement.style.margin = '0';
    menuElement.style.left = `${left}px`;
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
