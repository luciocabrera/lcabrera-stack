import type {
  TableAggregateFn,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

import { isShareableAggregate } from '../../utils';

type ToggleGroupShareArgs = {
  readonly columnKey: string;
  /** Which of the column's aggregates the share belongs to. */
  readonly fn: TableAggregateFn;
  readonly grouping: TableGroupingState;
};

/**
 * Turns one aggregate's share of the grand total on, or off when it is already
 * on.
 *
 * **It names an aggregate, not a column** (#831). `sum` and `count` are both
 * shareable, so on a column carrying both a bare column key could not say which
 * measure's share was meant — and toggling one has to leave the other's alone.
 *
 * **Adding is refused where the aggregate is not applied or is not shareable**,
 * and the state comes back untouched rather than repaired: a share over a
 * non-additive measure divides by a denominator the client cannot derive, and
 * the resulting percentages still sum to 100% while being wrong (#648). Every
 * surface offering this hides the control in that case, so the branch is not
 * reachable through the UI — it is here because this is the one function that
 * decides, and a reducer that trusted its callers would be a rule enforced only
 * by whoever remembered it.
 *
 * Removing is never refused: an aggregate the user has since removed can leave
 * a share behind, and the way out has to work whatever is applied now.
 */
export const toggleGroupShare = ({
  columnKey,
  fn,
  grouping,
}: ToggleGroupShareArgs): TableGroupingState => {
  const token = toTableAggregateToken({ columnKey, fn });
  const isRemoval = grouping.shares.some(
    (share) => toTableAggregateToken(share) === token,
  );
  const isApplied = grouping.aggregates.some(
    (entry) => toTableAggregateToken(entry) === token,
  );

  if (!isRemoval && !(isApplied && isShareableAggregate(fn))) {
    return grouping;
  }

  return {
    aggregates: grouping.aggregates,
    keys: grouping.keys,
    mode: grouping.mode,
    periods: grouping.periods,
    shares: isRemoval
      ? grouping.shares.filter(
          (share) => toTableAggregateToken(share) !== token,
        )
      : [...grouping.shares, { columnKey, fn }],
  };
};
