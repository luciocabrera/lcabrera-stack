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

/**
 * A self-connected delegate — it reads the applied aggregates from the grouping store
 * itself, so the shell above it forwards identity (`columnKey`, `fn`) and never state.
 * **The state derivation is `deriveAggregateCommandState`, not the shared
 * `deriveToggleCommandState` beside it** (#831).
 */
export const AggregateButton = ({
  columnKey,
  fn,
  onClose,
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
      orientation='horizontal'
      size='mini'
      variant={isActive ? 'primary' : 'ghost'}
    >
      {label}
    </Button>
  );
};
