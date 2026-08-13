import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  CLEAR_COLUMN_AGGREGATE_COMMAND,
  deriveToggleCommandState,
} from '#ui/components/Table/commands';
import { useSetTableColumnAggregate } from '#ui/components/Table/contexts/TableConfig/grouping/actions';
import { useGetTableColumnAggregate } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';

import type { ClearColumnAggregateButtonProps } from './ClearColumnAggregateButton.types';

/**
 * "No Aggregate" item: removes whatever aggregate is applied to this column.
 *
 * It **does** take a `columnKey`, unlike `ClearGroupingButton` beside it, and
 * the difference is not an oversight: an aggregate belongs to one column, so
 * clearing it is a question about that column, where clearing grouping is a
 * whole-table action that asks about none.
 *
 * `target: undefined` is `deriveToggleCommandState`'s clear command, so "is
 * there anything to clear" is answered there rather than restated here.
 */
export const ClearColumnAggregateButton = ({
  columnKey,
  onClose,
}: ClearColumnAggregateButtonProps) => {
  const setColumnAggregate = useSetTableColumnAggregate();
  const appliedFn = useGetTableColumnAggregate(columnKey);
  const { icon: ClearAggregateCommandIcon, label } =
    CLEAR_COLUMN_AGGREGATE_COMMAND;
  const { isEnabled } = deriveToggleCommandState({
    current: appliedFn,
    isDisabled: false,
    target: undefined,
  });

  const handleClearAggregate = () => {
    setColumnAggregate({ columnKey, fn: undefined });
    onClose();
  };

  return (
    <Button
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <ClearAggregateCommandIcon size={16} />
        </span>
      }
      isDisabled={!isEnabled}
      onClick={handleClearAggregate}
      orientation='horizontal'
      size='mini'
      variant='ghost'
    >
      {label}
    </Button>
  );
};
