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

/**
 * Refuse the whole URL grouping, never drop a key or aggregate (ADR-061): keys
 * are ordered and the order is the query's nesting. Aggregate columns are
 * checked for existence only — legality is a catalogue answer (ADR-058).
 */
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
  // Refused for the reason a duplicate **key** is: the pair is an aggregate's
  // identity, so a repeated one gives the staged list two rows nothing can tell
  // apart and a share no way to say which of them it belongs to (#831).
  const areAggregatesDistinct = appliedAggregates.size === aggregates.length;
  const isCountDistinctAffordable = isWithinCountDistinctBudget(aggregates);
  const appliedKeys = new Set(keys);
  const isEveryGranularityOnAKey = Object.keys(periods).every((column) =>
    appliedKeys.has(column),
  );
  // A share divides a measure by a total the client derives, and only an
  // additive measure has one it can derive correctly — so a share on any other
  // aggregate is not a rounding difference but a wrong number that still sums
  // to 100% (#648). It must also name an aggregate this configuration actually
  // applies, since a share of a measure nobody asked for divides nothing.
  // Refused with the rest rather than dropped, because a link promising a
  // percentage that silently does not appear is the failure ADR-061 refuses
  // whole configurations to avoid.
  const isEveryShareOnAShareableAggregate = shares.every(
    (share) =>
      isShareableAggregate(share.fn) &&
      appliedAggregates.has(toTableAggregateToken(share)),
  );
  // Refused for the same reason a duplicate aggregate is, and with a
  // consequence of its own: every reader downstream treats the shares as a set,
  // so a repeated entry makes `resolveTableGroupingUpdate` compare a length
  // against a set's size and report a change where there is none — a navigation
  // per click on a control that changed nothing (#648).
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
