import { Button } from '@repo/ui/components/Button';
import { SettingsIcon } from '@repo/ui/components/Icons';
import {
  useSetTableColumnSelectedKey,
  useSetTableDrawersOpenState,
} from '@repo/ui/components/Table/contexts/TableConfig/meta/actions';
import { tableActionsPopoverStyles } from '@repo/ui/components/Table/TableActionsPopover';
import * as stylex from '@stylexjs/stylex';

import type { ManageColumnActionProps } from './ManageColumnAction.types';

/**
 * "Manage Column" item of the column header actions menu: selects the column
 * and opens the per-column settings drawer, then closes the menu via
 * `onClose`. A section divider sits above it whenever a section precedes this
 * one (`hasSectionAbove`).
 */
export const ManageColumnAction = <TData,>({
  columnKey,
  hasSectionAbove = false,
  onClose,
}: ManageColumnActionProps<TData>) => {
  const setTableColumnSelectedKey = useSetTableColumnSelectedKey();
  const setTableDrawersOpenState = useSetTableDrawersOpenState();

  const handleManageColumn = () => {
    setTableColumnSelectedKey(columnKey);
    setTableDrawersOpenState({
      isColumnSettingsOpen: true,
      isTableSettingsOpen: false,
    });
    onClose();
  };

  return (
    <Button
      color='ghost'
      customStylex={[
        tableActionsPopoverStyles.menuItem,
        hasSectionAbove && tableActionsPopoverStyles.menuSectionDivider,
      ]}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <SettingsIcon size={16} />
        </span>
      }
      onClick={handleManageColumn}
      orientation='horizontal'
      size='mini'
    >
      Manage Column
    </Button>
  );
};
