import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  AGGREGATE_COMMANDS,
  deriveToggleCommandState,
} from '#ui/components/Table/commands';
import { useSetTableColumnAggregate } from '#ui/components/Table/contexts/TableConfig/grouping/actions';
import { useGetTableColumnAggregate } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';

import type { AggregateButtonProps } from './AggregateButton.types';

/**
 * One aggregation-mode item: applies its function to this column and highlights
 * itself while it is the applied one, clicking again to clear.
 *
 * A self-connected delegate — it reads the applied function from the grouping
 * store itself, so the shell above it forwards identity (`columnKey`, `fn`) and
 * never state.
 *
 * The state derivation is `deriveToggleCommandState` **unchanged**: an
 * aggregation mode is a toggle-to-a-value command exactly as a sort direction
 * is, with the applied function as `current` and this item's function as
 * `target`. That is the whole reason the store holds one aggregate per column
 * rather than a set — a set is not a toggle, and would have needed its own
 * derivation beside the shared one.
 */
export const AggregateButton = ({
  columnKey,
  fn,
  onClose,
}: AggregateButtonProps) => {
  const setColumnAggregate = useSetTableColumnAggregate();
  const appliedFn = useGetTableColumnAggregate(columnKey);
  const { icon: AggregateCommandIcon, label } = AGGREGATE_COMMANDS[fn];
  const { isActive, isEnabled } = deriveToggleCommandState({
    current: appliedFn,
    isDisabled: false,
    target: fn,
  });

  const handleSetAggregate = () => {
    setColumnAggregate({ columnKey, fn: isActive ? undefined : fn });
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
