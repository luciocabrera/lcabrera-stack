import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnVisibilityState,
  TableColumn,
  TableColumnAggregate,
} from '../Table.types';

import { resolveDeclaredGroupingKeys } from './resolveDeclaredGroupingKeys.util';
import { toTableAggregateToken } from './tableAggregateToken.util';

type WithAggregateColumnOrderArgs<TData> = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly groupingKeys: readonly string[];
};

export const withAggregateColumnOrder = <TData>({
  aggregates,
  columnOrder,
  columnPinning,
  columns,
  columnVisibility,
  groupingKeys,
}: WithAggregateColumnOrderArgs<TData>) => {
  const unchanged = { columnOrder, columnPinning, columns, columnVisibility };

  if (
    aggregates.length === 0 ||
    resolveDeclaredGroupingKeys({ columns, groupingKeys }).length === 0
  ) {
    return unchanged;
  }

  const columnByKey = new Map(
    columns.map((column) => [String(column.key), column] as const),
  );
  const measuresBySource = new Map<string, string[]>();

  for (const aggregate of aggregates) {
    const token = toTableAggregateToken(aggregate);

    if (!columnByKey.has(token)) continue;

    measuresBySource.set(aggregate.columnKey, [
      ...(measuresBySource.get(aggregate.columnKey) ?? []),
      token,
    ]);
  }

  const ranked = measuresBySource.values().toArray().flat();

  if (ranked.length === 0) return unchanged;

  const rankedKeys = new Set(ranked);
  const spliceRanked = (keys: readonly string[]) => {
    const firstRanked = keys.findIndex((key) => rankedKeys.has(key));

    if (firstRanked === -1) return;

    const rest = keys.filter((key) => !rankedKeys.has(key));

    return [
      ...rest.slice(0, firstRanked),
      ...ranked,
      ...rest.slice(firstRanked),
    ];
  };

  const orderedColumnKeys = spliceRanked(
    columns.map((column) => String(column.key)),
  );
  const orderedOrderKeys = spliceRanked(columnOrder.map(String));

  return {
    columnOrder:
      orderedOrderKeys === undefined
        ? columnOrder
        : (orderedOrderKeys as ColumnOrderState<TData>),
    columnPinning,
    columns:
      orderedColumnKeys === undefined
        ? columns
        : orderedColumnKeys
            .map((key) => columnByKey.get(key))
            .filter((column) => column !== undefined),
    columnVisibility,
  };
};
