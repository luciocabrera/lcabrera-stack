import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { isShareableAggregate } from '../../utils';

type ToggleGroupShareArgs = {
  readonly columnKey: string;
  readonly grouping: TableGroupingState;
};

/**
 * Turns a column's share of the grand total on, or off when it is already on.
 *
 * **Adding is refused where the aggregate is not shareable**, and the state
 * comes back untouched rather than repaired: a share over a non-additive
 * measure divides by a denominator the client cannot derive, and the resulting
 * percentages still sum to 100% while being wrong (#648). Every surface
 * offering this hides the control in that case, so the branch is not reachable
 * through the UI — it is here because this is the one function that decides,
 * and a reducer that trusted its callers would be a rule enforced only by
 * whoever remembered it.
 *
 * Removing is never refused: an aggregate the user has since changed can leave
 * a share behind, and the way out has to work whatever the aggregate now is.
 */
export const toggleGroupShare = ({
  columnKey,
  grouping,
}: ToggleGroupShareArgs): TableGroupingState => {
  const isRemoval = grouping.shares.includes(columnKey);

  if (!isRemoval && !isShareableAggregate(grouping.aggregates[columnKey])) {
    return grouping;
  }

  return {
    aggregates: grouping.aggregates,
    keys: grouping.keys,
    mode: grouping.mode,
    periods: grouping.periods,
    shares: isRemoval
      ? grouping.shares.filter((column) => column !== columnKey)
      : [...grouping.shares, columnKey],
  };
};
