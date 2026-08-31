import type {
  TableColumnAggregate,
  TableGroupingMode,
  TableGroupingState,
  TableGroupPeriod,
} from '#ui/components/Table/Table.types';

import {
  areGroupAggregatesLegal,
  areGroupKeysLegal,
  pruneGroupPeriods,
  pruneGroupShares,
} from '../grouping/utils';

type GetInitialGroupingStateArgs = {
  readonly groupingAggregates?: readonly TableColumnAggregate[];
  readonly groupingKeys?: readonly string[];
  readonly groupingMode?: TableGroupingMode;
  readonly groupingPeriods?: Readonly<Record<string, TableGroupPeriod>>;
  readonly groupingShares?: readonly TableColumnAggregate[];
};

const NO_GROUPING: TableGroupingState = {
  aggregates: [],
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
};

export const getInitialGroupingState = ({
  groupingAggregates = [],
  groupingKeys = [],
  groupingMode = 'flat',
  groupingPeriods = {},
  groupingShares = [],
}: GetInitialGroupingStateArgs): TableGroupingState => {
  if (
    groupingKeys.length === 0 ||
    !areGroupKeysLegal(groupingKeys) ||
    !areGroupAggregatesLegal(groupingAggregates)
  ) {
    return NO_GROUPING;
  }

  return {
    aggregates: [...groupingAggregates],
    keys: [...groupingKeys],
    mode: groupingMode,
    periods: pruneGroupPeriods({
      keys: groupingKeys,
      periods: groupingPeriods,
    }),
    shares: pruneGroupShares({
      aggregates: groupingAggregates,
      shares: groupingShares,
    }),
  };
};
