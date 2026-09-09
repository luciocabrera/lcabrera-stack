import type { TableGroupingState } from '#ui/components/Table/Table.types';

import {
  areGroupAggregatesLegal,
  areGroupKeysLegal,
  pruneGroupPeriods,
  pruneGroupShares,
} from '../grouping/utils';

const NO_GROUPING: TableGroupingState = {
  aggregates: [],
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
  totalsPlacement: 'last',
};

export const getInitialGroupingState = ({
  aggregates = [],
  keys = [],
  mode = 'flat',
  periods = {},
  shares = [],
  totalsPlacement = 'last',
}: Partial<TableGroupingState>): TableGroupingState => {
  if (
    keys.length === 0 ||
    !areGroupKeysLegal(keys) ||
    !areGroupAggregatesLegal(aggregates)
  ) {
    return { ...NO_GROUPING, totalsPlacement };
  }

  return {
    aggregates: [...aggregates],
    keys: [...keys],
    mode,
    periods: pruneGroupPeriods({
      keys,
      periods,
    }),
    shares: pruneGroupShares({
      aggregates,
      shares,
    }),
    totalsPlacement,
  };
};
