import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  deriveToggleCommandState,
  SORT_DESCENDING_COMMAND,
} from '#ui/components/Table/commands';
import { useSetColumnSorting } from '#ui/components/Table/contexts/TableConfig/columns/actions';
import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

import type { SortDescendingButtonProps } from './SortDescendingButton.types';

/**
 * Identity and active-state come from the shared `SORT_DESCENDING_COMMAND` (ADR-011); this
 * surface owns only its live commit-context and menu presentation.
 */
export const SortDescendingButton = <TData,>({
  columnKey,
  onClose,
  sortDirection,
}: SortDescendingButtonProps<TData>) => {
  const setSorting = useSetColumnSorting<TData>();
  const column = useGetNormalizedColumn<TData>(columnKey);
  const { isSortable } = resolveColumnCapabilities(column);
  const { icon: SortDescendingCommandIcon, label } = SORT_DESCENDING_COMMAND;
  const { isActive, isEnabled } = deriveToggleCommandState({
    current: sortDirection,
    isDisabled: !isSortable,
    target: 'desc',
  });

  const handleDescending = () => {
    setSorting({ columnKey, direction: isActive ? undefined : 'desc' });
    onClose();
  };

  return (
    <Button
      aria-pressed={isActive}
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <SortDescendingCommandIcon size={16} />
        </span>
      }
      isDisabled={!isEnabled}
      onClick={handleDescending}
      orientation='horizontal'
      size='mini'
      variant={isActive ? 'primary' : 'ghost'}
    >
      {label}
    </Button>
  );
};
