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
