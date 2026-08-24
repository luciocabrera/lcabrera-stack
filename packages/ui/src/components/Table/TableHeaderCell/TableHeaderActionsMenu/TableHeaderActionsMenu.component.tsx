import * as stylex from '@stylexjs/stylex';

import { useGetTableIsGroupingEnabled } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import {
  TableActionsPopover,
  TableActionsPopoverSeparator,
  tableActionsPopoverStyles,
} from '#ui/components/Table/TableActionsPopover';

import type { TableHeaderActionsMenuProps } from './TableHeaderActionsMenu.types';

import { GroupActions } from './GroupActions/GroupActions.component';
import { ManageColumnAction } from './ManageColumnAction/ManageColumnAction.component';
import { PinAndHideActions } from './PinAndHideActions/PinAndHideActions.component';
import { SortActions } from './SortActions/SortActions.component';
import { tableHeaderActionsMenuStyles } from './TableHeaderActionsMenu.stylex';

/**
 * Grouping is read here rather than passed in: it is a route capability, not a column one,
 * so it comes from the meta store the loader seeded (ADR-063).
 * A route that never declared it gets no grouping section at all — the menu it renders is
 * byte-identical to the one it rendered before grouping existed.
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
  const isGroupingEnabled = useGetTableIsGroupingEnabled();
  const hasSorting = Boolean(isSortable);
  const hasPinAndHide = !isStatic;
  const hasManage = Boolean(hasSettings);

  if (!hasSorting && !isGroupingEnabled && !hasPinAndHide && !hasManage) return;

  // A column with nothing above "Manage Column" puts it alone in the menu, with
  // nothing to separate from.
  const isManageTheOnlySection = isStatic && !isSortable && !isGroupingEnabled;
  const hasSectionAbovePinAndHide = Boolean(hasSorting || isGroupingEnabled);

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
          {isGroupingEnabled && (
            <>
              {hasSorting && <TableActionsPopoverSeparator />}
              <GroupActions<TData> columnKey={columnKey} onClose={closeMenu} />
            </>
          )}
          {hasPinAndHide && (
            <>
              {hasSectionAbovePinAndHide && <TableActionsPopoverSeparator />}
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
