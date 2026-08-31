import type { TableColumn } from '#ui/components/Table';
import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { isShareableAggregate } from '#ui/components/Table/contexts/TableConfig/grouping/utils';
import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';
import { isWithinCountDistinctBudget } from '#ui/components/Table/utils/isWithinCountDistinctBudget.util';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';
import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

type SanitizeGroupingByColumnsArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly grouping: TableGroupingState;
};

const NO_GROUPING: TableGroupingState = {
  aggregates: [],
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
};

export const sanitizeGroupingByColumns = <
  TData extends Record<string, unknown>,
>({
  columns,
  grouping,
}: SanitizeGroupingByColumnsArgs<TData>): TableGroupingState => {
  const { aggregates, keys, mode, periods, shares } = grouping;

  if (keys.length === 0 || keys.length > MAX_TABLE_GROUP_KEYS) {
    return NO_GROUPING;
  }

  const groupableKeys = new Set(
    columns
      .filter((column) => resolveColumnCapabilities(column).isGroupable)
      .map((column) => String(column.key)),
  );
  const declaredKeys = new Set(columns.map((column) => String(column.key)));

  const isEveryKeyGroupable = keys.every((key) => groupableKeys.has(key));
  const areKeysDistinct = new Set(keys).size === keys.length;
  const isEveryAggregateColumnDeclared = aggregates.every(({ columnKey }) =>
    declaredKeys.has(columnKey),
  );
  const appliedAggregates = new Set(
    aggregates.map((entry) => toTableAggregateToken(entry)),
  );
  const areAggregatesDistinct = appliedAggregates.size === aggregates.length;
  const isCountDistinctAffordable = isWithinCountDistinctBudget(aggregates);
  const appliedKeys = new Set(keys);
  const isEveryGranularityOnAKey = Object.keys(periods).every((column) =>
    appliedKeys.has(column),
  );
  const isEveryShareOnAShareableAggregate = shares.every(
    (share) =>
      isShareableAggregate(share.fn) &&
      appliedAggregates.has(toTableAggregateToken(share)),
  );
  const areSharesDistinct =
    new Set(shares.map((entry) => toTableAggregateToken(entry))).size ===
    shares.length;

  return isEveryKeyGroupable &&
    areKeysDistinct &&
    isEveryAggregateColumnDeclared &&
    areAggregatesDistinct &&
    isCountDistinctAffordable &&
    isEveryGranularityOnAKey &&
    isEveryShareOnAShareableAggregate &&
    areSharesDistinct
    ? {
        aggregates: [...aggregates],
        keys: [...keys],
        mode,
        periods: { ...periods },
        shares: [...shares],
      }
    : NO_GROUPING;
};
