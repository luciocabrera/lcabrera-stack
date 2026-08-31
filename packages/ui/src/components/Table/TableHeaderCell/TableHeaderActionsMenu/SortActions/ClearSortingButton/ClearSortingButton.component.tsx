import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  CLEAR_SORTING_COMMAND,
  deriveToggleCommandState,
} from '#ui/components/Table/commands';
import { useSetColumnSorting } from '#ui/components/Table/contexts/TableConfig/columns/actions';
import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

import type { ClearSortingButtonProps } from './ClearSortingButton.types';

export const ClearSortingButton = <TData,>({
  columnKey,
  onClose,
  sortDirection,
}: ClearSortingButtonProps<TData>) => {
  const setSorting = useSetColumnSorting<TData>();
  const column = useGetNormalizedColumn<TData>(columnKey);
  const { isSortable } = resolveColumnCapabilities(column);
  const { icon: ClearSortingCommandIcon, label } = CLEAR_SORTING_COMMAND;
  const { isEnabled } = deriveToggleCommandState({
    current: sortDirection,
    isDisabled: !isSortable,
    target: undefined,
  });

  const handleClearSorting = () => {
    setSorting({ columnKey, direction: undefined });
    onClose();
  };

  return (
    <Button
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <ClearSortingCommandIcon size={16} />
        </span>
      }
      isDisabled={!isEnabled}
      onClick={handleClearSorting}
      orientation='horizontal'
      size='mini'
      variant='ghost'
    >
      {label}
    </Button>
  );
};
