import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { SettingsIcon } from '#ui/components/Icons';
import {
  useSetTableColumnSelectedKey,
  useSetTableDrawersOpenState,
} from '#ui/components/Table/contexts/TableConfig/meta/actions';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';

import type { ManageColumnActionProps } from './ManageColumnAction.types';

export const ManageColumnAction = <TData,>({
  columnKey,
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
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <SettingsIcon size={16} />
        </span>
      }
      onClick={handleManageColumn}
      orientation='horizontal'
      size='mini'
      variant='ghost'
    >
      Manage Column
    </Button>
  );
};
