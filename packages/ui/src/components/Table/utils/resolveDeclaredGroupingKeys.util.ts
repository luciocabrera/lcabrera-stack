import type { TableColumn } from '../Table.types';

type ResolveDeclaredGroupingKeysArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly groupingKeys: readonly string[];
};

/**
 * Grouping configuration is URL state, so it can name a column the consumer never declared
 * — a shared link from a route with a different column set, or a hand-edited param.
 * `withGroupedColumnLayout` hoists only declared keys, so a render path that disagreed
 * would drift on exactly the row nobody tests: with an undeclared key first,
 * `resolveGroupKeyCellText` would look for the grand total in a column that is never
 * painted, and the one row a rollup exists to produce would render as a bare line of
 * aggregates with nothing saying what they total.
 */
export const resolveDeclaredGroupingKeys = <TData>({
  columns,
  groupingKeys,
}: ResolveDeclaredGroupingKeysArgs<TData>) => {
  if (groupingKeys.length === 0) return groupingKeys;

  const declared = new Set(columns.map((column) => String(column.key)));

  return groupingKeys.filter((groupKey) => declared.has(groupKey));
};
