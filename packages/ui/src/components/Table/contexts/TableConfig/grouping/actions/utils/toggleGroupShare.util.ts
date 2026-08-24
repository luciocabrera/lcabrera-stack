import type {
  TableAggregateFn,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

import { isShareableAggregate } from '../../utils';

type ToggleGroupShareArgs = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
  readonly grouping: TableGroupingState;
};

/**
 * `sum` and `count` are both shareable, so on a column carrying both a bare column key
 * could not say which measure's share was meant — and toggling one has to leave the
 * other's alone.
 * **Adding is refused where the aggregate is not applied or is not shareable**, and the
 * state comes back untouched rather than repaired: a share over a non-additive measure
 * divides by a denominator the client cannot derive, and the resulting percentages still
 * sum to 100% while being wrong (#648).
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
