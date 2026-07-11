import { Button } from '@repo/ui/components/Button';
import {
  EraserIcon,
  EyeOffIcon,
  PinLeftIcon,
  PinRightIcon,
  SettingsIcon,
  SortAscIcon,
  SortDescIcon,
} from '@repo/ui/components/Icons';
import {
  useSetColumnPinning,
  useSetColumnSorting,
  useSetColumnVisibility,
} from '@repo/ui/components/Table/contexts/TableConfig/columns/actions';
import {
  useSetTableColumnSelectedKey,
  useSetTableDrawersOpenState,
} from '@repo/ui/components/Table/contexts/TableConfig/meta/actions';
import {
  TableActionsPopover,
  tableActionsPopoverStyles,
} from '@repo/ui/components/Table/TableActionsPopover';
import * as stylex from '@stylexjs/stylex';

import type { TableHeaderActionsMenuProps } from './TableHeaderActionsMenu.types';

import { tableHeaderActionsMenuStyles } from './TableHeaderActionsMenu.stylex';

export const TableHeaderActionsMenu = <TData,>({
  columnKey,
  columnLabel,
  hasSettings,
  isSortable,
  isStatic,
  pinSide,
  sortDirection,
}: TableHeaderActionsMenuProps<TData>) => {
  const setSorting = useSetColumnSorting<TData>();
  const setColumnPinning = useSetColumnPinning<TData>();
  const setColumnVisibility = useSetColumnVisibility<TData>();
  const setTableColumnSelectedKey = useSetTableColumnSelectedKey();
  const setTableDrawersOpenState = useSetTableDrawersOpenState();

  const hasAnyAction = isSortable || !isStatic || hasSettings;

  if (!hasAnyAction) return;

  return (
    <TableActionsPopover
      ariaLabel={`${columnLabel} column actions`}
      customStylex={tableHeaderActionsMenuStyles.trigger}
      label={`${columnLabel} column actions`}
    >
      {({ closeMenu }) => {
        const handleAscending = () => {
          setSorting({
            columnKey,
            direction: sortDirection === 'asc' ? undefined : 'asc',
          });
          closeMenu();
        };

        const handleDescending = () => {
          setSorting({
            columnKey,
            direction: sortDirection === 'desc' ? undefined : 'desc',
          });
          closeMenu();
        };

        const handleClearSorting = () => {
          setSorting({ columnKey, direction: undefined });
          closeMenu();
        };

        const handlePinLeft = () => {
          setColumnPinning({
            columnKey,
            side: pinSide === 'left' ? undefined : 'left',
          });
          closeMenu();
        };

        const handlePinRight = () => {
          setColumnPinning({
            columnKey,
            side: pinSide === 'right' ? undefined : 'right',
          });
          closeMenu();
        };

        const handleHideColumn = () => {
          setColumnVisibility({ columnKey, isVisible: false });
          closeMenu();
        };

        const handleManageColumn = () => {
          setTableColumnSelectedKey(columnKey);
          setTableDrawersOpenState({
            isColumnSettingsOpen: true,
            isTableSettingsOpen: false,
          });
          closeMenu();
        };

        return (
          <div {...stylex.props(tableActionsPopoverStyles.menuActions)}>
            {isSortable && (
              <>
                <Button
                  color='ghost'
                  customStylex={tableActionsPopoverStyles.menuItem}
                  icon={
                    <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
                      <SortAscIcon size={16} />
                    </span>
                  }
                  onClick={handleAscending}
                  orientation='horizontal'
                  size='mini'
                  width='full'
                >
                  Ascending
                </Button>
                <Button
                  color='ghost'
                  customStylex={tableActionsPopoverStyles.menuItem}
                  icon={
                    <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
                      <SortDescIcon size={16} />
                    </span>
                  }
                  onClick={handleDescending}
                  orientation='horizontal'
                  size='mini'
                  width='full'
                >
                  Descending
                </Button>
                {sortDirection !== undefined && (
                  <Button
                    color='ghost'
                    customStylex={tableActionsPopoverStyles.menuItem}
                    icon={
                      <span
                        {...stylex.props(tableActionsPopoverStyles.menuIcon)}
                      >
                        <EraserIcon size={16} />
                      </span>
                    }
                    onClick={handleClearSorting}
                    orientation='horizontal'
                    size='mini'
                    width='full'
                  >
                    Clear Sorting
                  </Button>
                )}
              </>
            )}
            {!isStatic && (
              <>
                <Button
                  color='ghost'
                  customStylex={tableActionsPopoverStyles.menuItem}
                  icon={
                    <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
                      <PinLeftIcon size={16} />
                    </span>
                  }
                  onClick={handlePinLeft}
                  orientation='horizontal'
                  size='mini'
                  width='full'
                >
                  Pin Left
                </Button>
                <Button
                  color='ghost'
                  customStylex={tableActionsPopoverStyles.menuItem}
                  icon={
                    <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
                      <PinRightIcon size={16} />
                    </span>
                  }
                  onClick={handlePinRight}
                  orientation='horizontal'
                  size='mini'
                  width='full'
                >
                  Pin Right
                </Button>
                <Button
                  color='ghost'
                  customStylex={tableActionsPopoverStyles.menuItem}
                  icon={
                    <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
                      <EyeOffIcon size={16} />
                    </span>
                  }
                  onClick={handleHideColumn}
                  orientation='horizontal'
                  size='mini'
                  width='full'
                >
                  Hide Column
                </Button>
              </>
            )}
            {hasSettings && (
              <Button
                color='ghost'
                customStylex={tableActionsPopoverStyles.menuItem}
                icon={
                  <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
                    <SettingsIcon size={16} />
                  </span>
                }
                onClick={handleManageColumn}
                orientation='horizontal'
                size='mini'
                width='full'
              >
                Manage Column
              </Button>
            )}
          </div>
        );
      }}
    </TableActionsPopover>
  );
};
