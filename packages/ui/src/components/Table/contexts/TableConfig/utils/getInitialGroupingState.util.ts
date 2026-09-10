import type { TableGroupingState } from '#ui/components/Table/Table.types';

import {
  areGroupAggregatesLegal,
  areGroupKeysLegal,
  pruneColumnAxis,
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
  columnAxis,
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

  const nextColumnAxis = pruneColumnAxis({ columnAxis, keys });

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
    ...(nextColumnAxis !== undefined && { columnAxis: nextColumnAxis }),
  };
};
