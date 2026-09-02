import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  AGGREGATE_COMMANDS,
  deriveAggregateCommandState,
} from '#ui/components/Table/commands';
import {
  useAddTableColumnAggregate,
  useRemoveTableColumnAggregate,
} from '#ui/components/Table/contexts/TableConfig/grouping/actions';
import { useGetTableGroupingAggregates } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';

import type { AggregateButtonProps } from './AggregateButton.types';

export const AggregateButton = ({
  columnKey,
  fn,
  onClose,
  title,
}: AggregateButtonProps) => {
  const addColumnAggregate = useAddTableColumnAggregate();
  const removeColumnAggregate = useRemoveTableColumnAggregate();
  const applied = useGetTableGroupingAggregates();
  const { icon: AggregateCommandIcon, label } = AGGREGATE_COMMANDS[fn];
  const { isActive, isEnabled } = deriveAggregateCommandState({
    applied,
    columnKey,
    isDisabled: false,
    target: fn,
  });

  const handleSetAggregate = () => {
    if (isActive) {
      removeColumnAggregate({ columnKey, fn });
    } else {
      addColumnAggregate({ columnKey, fn });
    }

    onClose();
  };

  return (
    <Button
      aria-pressed={isActive}
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <AggregateCommandIcon size={16} />
        </span>
      }
      isDisabled={!isEnabled}
      onClick={handleSetAggregate}
      {...(title !== undefined && { title })}
      orientation='horizontal'
      size='mini'
      variant={isActive ? 'primary' : 'ghost'}
    >
      {label}
    </Button>
  );
};
