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

/**
 * Refuse the whole seed, never truncate or de-dupe — a published package, so a
 * consumer's own loader can reach here without `sanitizeGroupingByColumns`. An
 * illegal seed answers no grouping (there is no prior state to leave alone).
 */
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
    // Pruned to the keys that survived, so a granularity for a key the loader
    // did not apply cannot reach the server, which refuses one (#786).
    periods: pruneGroupPeriods({
      keys: groupingKeys,
      periods: groupingPeriods,
    }),
    // Pruned to the aggregates the loader actually applied, and only the
    // shareable ones: a share is a ratio over a measure, so one naming a
    // measure that is not there divides nothing (#648, per aggregate since
    // #831).
    shares: pruneGroupShares({
      aggregates: groupingAggregates,
      shares: groupingShares,
    }),
  };
};
