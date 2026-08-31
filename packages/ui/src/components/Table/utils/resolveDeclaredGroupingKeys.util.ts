import type { TableColumn } from '../Table.types';

type ResolveDeclaredGroupingKeysArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly groupingKeys: readonly string[];
};

export const resolveDeclaredGroupingKeys = <TData>({
  columns,
  groupingKeys,
}: ResolveDeclaredGroupingKeysArgs<TData>) => {
  if (groupingKeys.length === 0) return groupingKeys;

  const declared = new Set(columns.map((column) => String(column.key)));

  return groupingKeys.filter((groupKey) => declared.has(groupKey));
};
