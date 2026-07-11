import {
  TableActionsPopover,
  tableActionsPopoverStyles,
} from '@repo/ui/components/Table/TableActionsPopover';
import * as stylex from '@stylexjs/stylex';

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
  const hasAnyAction = isSortable || !isStatic || hasSettings;

  if (!hasAnyAction) return;

  return (
    <TableActionsPopover
      ariaLabel={`${columnLabel} column actions`}
      customStylex={tableHeaderActionsMenuStyles.trigger}
      label={`${columnLabel} column actions`}
    >
      {({ closeMenu }) => (
        <div {...stylex.props(tableActionsPopoverStyles.menuActions)}>
          {isSortable && (
            <SortActions<TData>
              columnKey={columnKey}
              onClose={closeMenu}
              sortDirection={sortDirection}
            />
          )}
          {!isStatic && (
            <PinAndHideActions<TData>
              columnKey={columnKey}
              onClose={closeMenu}
              pinSide={pinSide}
            />
          )}
          {hasSettings && (
            <ManageColumnAction<TData>
              columnKey={columnKey}
              onClose={closeMenu}
            />
          )}
        </div>
      )}
    </TableActionsPopover>
  );
};
