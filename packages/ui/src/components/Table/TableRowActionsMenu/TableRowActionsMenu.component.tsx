import { TableActionButton } from '@repo/ui/components/Table/TableActionButton';
import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';
import { useFetcher } from 'react-router';

import type { TableRowActionsMenuProps } from './TableRowActionsMenu.types';

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
import { useTableRowActionsMenuPosition } from './useTableRowActionsMenuPosition.hook';

const DEFAULT_TITLE_SINGULAR = 'Record';

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
  const menuId = useId().replaceAll(':', '');
  const triggerId = `${menuId}-trigger`;

  const {
    closeMenu,
    handlePopoverToggle,
    handleToggleMenu,
    isMenuOpen,
    menuPosition,
    menuRef,
  } = useTableRowActionsMenuPosition({
    containerRef,
    isEnabled: Boolean(crud),
    triggerId,
  });

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

    closeMenu();
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
