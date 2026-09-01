import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  CLEAR_COLUMN_AGGREGATE_COMMAND,
  deriveAggregateCommandState,
} from '#ui/components/Table/commands';
import { useRemoveTableColumnAggregate } from '#ui/components/Table/contexts/TableConfig/grouping/actions';
import { useGetTableGroupingAggregates } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';

import type { ClearColumnAggregateButtonProps } from './ClearColumnAggregateButton.types';

export const ClearColumnAggregateButton = ({
  columnKey,
  onClose,
  title,
}: ClearColumnAggregateButtonProps) => {
  const removeColumnAggregate = useRemoveTableColumnAggregate();
  const applied = useGetTableGroupingAggregates();
  const { icon: ClearAggregateCommandIcon, label } =
    CLEAR_COLUMN_AGGREGATE_COMMAND;
  const { isEnabled } = deriveAggregateCommandState({
    applied,
    columnKey,
    isDisabled: false,
    target: undefined,
  });

  const handleClearAggregate = () => {
    removeColumnAggregate({ columnKey });
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
      {...(title !== undefined && { title })}
      orientation='horizontal'
      size='mini'
      variant='ghost'
    >
      {label}
    </Button>
  );
};
