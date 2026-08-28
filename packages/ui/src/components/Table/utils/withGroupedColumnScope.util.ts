import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnVisibilityState,
  TableColumn,
  TableColumnAggregate,
} from '../Table.types';

import { ACTIONS_COLUMN_KEY } from '../Table.constants';
import { resolveDeclaredGroupingKeys } from './resolveDeclaredGroupingKeys.util';
import { toTableAggregateToken } from './tableAggregateToken.util';

type WithGroupedColumnScopeArgs<TData> = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly groupingKeys: readonly string[];
};

/**
 * Derivation, never state (ADR-095): while grouping is applied the grid holds the group
 * keys, the measures and the row-actions column, and nothing else.
 */
export const withGroupedColumnScope = <TData>({
  aggregates,
  columnOrder,
  columnPinning,
  columns,
  columnVisibility,
  groupingKeys,
}: WithGroupedColumnScopeArgs<TData>) => {
  const unchanged = { columnOrder, columnPinning, columns, columnVisibility };

  const keys = resolveDeclaredGroupingKeys({ columns, groupingKeys });

  if (keys.length === 0) return unchanged;

  const scopedKeys = new Set<string>([
    ...keys,
    ...aggregates.map((aggregate) => toTableAggregateToken(aggregate)),
    ACTIONS_COLUMN_KEY,
  ]);

  return {
    ...unchanged,
    columns: columns.filter((column) => scopedKeys.has(String(column.key))),
  };
};
