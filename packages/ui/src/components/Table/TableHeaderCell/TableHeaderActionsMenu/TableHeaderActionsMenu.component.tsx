import * as stylex from '@stylexjs/stylex';

import {
  TableActionsPopover,
  TableActionsPopoverSeparator,
  tableActionsPopoverStyles,
} from '#ui/components/Table/TableActionsPopover';

import type { TableHeaderActionsMenuProps } from './TableHeaderActionsMenu.types';

import { ManageColumnAction } from './ManageColumnAction/ManageColumnAction.component';
import { PinAndHideActions } from './PinAndHideActions/PinAndHideActions.component';
import { SortActions } from './SortActions/SortActions.component';
import { tableHeaderActionsMenuStyles } from './TableHeaderActionsMenu.stylex';

/**
 * Column header popover menu composing the sort, pin/hide, and manage-column
 * sections. Renders nothing (no trigger) when the column has no
 * sortable/pinnable/settings affordance at all.
 */
export const TableHeaderActionsMenu = <TData,>({
  columnKey,
  columnLabel,
  hasSettings,
  isSortable,
  isStatic,
  pinSide,
  sortDirection,
}: TableHeaderActionsMenuProps<TData>) => {
  const hasSorting = Boolean(isSortable);
  const hasPinAndHide = !isStatic;
  const hasManage = Boolean(hasSettings);

  if (!hasSorting && !hasPinAndHide && !hasManage) return;

  // A column that is neither sortable nor movable puts "Manage Column" alone in
  // the menu, with nothing above it to separate from.
  const isManageTheOnlySection = isStatic && !isSortable;

  return (
    <TableActionsPopover
      ariaLabel={`${columnLabel} column actions`}
      customStylex={tableHeaderActionsMenuStyles.trigger}
      label={`${columnLabel} column actions`}
    >
      {({ closeMenu }) => (
        <div {...stylex.props(tableActionsPopoverStyles.menuActions)}>
          {hasSorting && (
            <SortActions<TData>
              columnKey={columnKey}
              onClose={closeMenu}
              sortDirection={sortDirection}
            />
          )}
          {hasPinAndHide && (
            <>
              {hasSorting && <TableActionsPopoverSeparator />}
              <PinAndHideActions<TData>
                columnKey={columnKey}
                onClose={closeMenu}
                pinSide={pinSide}
              />
            </>
          )}
          {hasManage && (
            <>
              {!isManageTheOnlySection && <TableActionsPopoverSeparator />}
              <ManageColumnAction<TData>
                columnKey={columnKey}
                onClose={closeMenu}
              />
            </>
          )}
        </div>
      )}
    </TableActionsPopover>
  );
};
