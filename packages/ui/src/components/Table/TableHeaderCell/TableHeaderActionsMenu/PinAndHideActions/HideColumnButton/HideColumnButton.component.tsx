import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { EyeOffIcon } from '#ui/components/Icons';
import { useSetColumnVisibility } from '#ui/components/Table/contexts/TableConfig/columns/actions';
import { useTableColumnLayoutLock } from '#ui/components/Table/hooks';
import { TABLE_COLUMN_LAYOUT_LOCK_LABELS } from '#ui/components/Table/Table.constants';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';

import type { HideColumnButtonProps } from './HideColumnButton.types';

export const HideColumnButton = <TData,>({
  columnKey,
  onClose,
}: HideColumnButtonProps<TData>) => {
  const setColumnVisibility = useSetColumnVisibility<TData>();
  const isGroupKey = useTableColumnLayoutLock<TData>(columnKey) === 'group-key';

  const handleHideColumn = () => {
    setColumnVisibility({ columnKey, isVisible: false });
    onClose();
  };

  return (
    <Button
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <EyeOffIcon size={16} />
        </span>
      }
      isDisabled={isGroupKey}
      {...(isGroupKey && {
        title: `Cannot hide this column: ${TABLE_COLUMN_LAYOUT_LOCK_LABELS['group-key']}.`,
      })}
      onClick={handleHideColumn}
      orientation='horizontal'
      size='mini'
      variant='ghost'
    >
      Hide Column
    </Button>
  );
};
