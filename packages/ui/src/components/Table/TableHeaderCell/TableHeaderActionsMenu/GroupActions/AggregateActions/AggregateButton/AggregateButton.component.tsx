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
 * One aggregation-mode item: applies its function to this column and highlights
 * itself while it is applied, clicking again to clear that one.
 *
 * A self-connected delegate — it reads the applied aggregates from the grouping
 * store itself, so the shell above it forwards identity (`columnKey`, `fn`) and
 * never state.
 *
 * **The state derivation is `deriveAggregateCommandState`, not the shared
 * `deriveToggleCommandState` beside it** (#831). A column may carry several
 * aggregates at once, so "is this one applied" is set membership rather than
 * equality against a single current value, and several items here can be active
 * together. Sorting and pinning keep the shared helper because their values
 * genuinely are single-valued.
 *
 * Clicking an applied item removes exactly that `(columnKey, fn)` pair and
 * leaves the column's other aggregates alone; clicking an unapplied one appends
 * it. Neither path can produce the pair twice.
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
