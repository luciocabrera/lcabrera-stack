import type {
  TableAggregateFn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';

type AggregateCommandStateArgs = {
  /** Every aggregate the surface's own store has applied, in order. */
  readonly applied: readonly TableColumnAggregate[];
  readonly columnKey: string;
  /** Whether the capability is unavailable for this column. */
  readonly isDisabled: boolean;
  /** The function the command applies; `undefined` is the "clear" command. */
  readonly target: TableAggregateFn | undefined;
};

/**
 * Active/enabled state for an aggregate command against a column (ADR-011).
 *
 * **This exists beside `deriveToggleCommandState` rather than widening it**, and
 * that is the point of the split (#831). A sort direction and a pin side are
 * genuinely single-valued — picking `asc` un-picks `desc` — so their derivation
 * asks whether one current value equals the command's target. A column may
 * carry any number of aggregates at once, so the same question is set
 * membership, and every item can be active at the same time. Widening the shared
 * helper to a set would have made sorting express a state it does not have.
 *
 * Everything else is deliberately identical to the shared helper, so the two
 * read as the same command contract: `isActive` where the command's function is
 * applied to this column, and `isEnabled` unless the capability is off — and,
 * for the clear command (`target: undefined`), unless there is nothing to clear.
 *
 * Pure, and fed from the caller's own selector: the header menu passes the live
 * store's list and the drawer would pass its draft, so the derivation lives once
 * while the state source stays correct per surface.
 */
export const deriveAggregateCommandState = ({
  applied,
  columnKey,
  isDisabled,
  target,
}: AggregateCommandStateArgs) => {
  const onColumn = applied.filter((entry) => entry.columnKey === columnKey);

  return {
    isActive:
      target !== undefined && onColumn.some((entry) => entry.fn === target),
    isEnabled: !isDisabled && (target !== undefined || onColumn.length > 0),
  };
};
