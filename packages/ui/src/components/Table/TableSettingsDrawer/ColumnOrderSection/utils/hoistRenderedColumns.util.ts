import type { TableColumn } from '#ui/components/Table/Table.types';

type HoistRenderedColumnsArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly groupingKeys: readonly string[];
  readonly renderedColumnKeys: readonly string[];
};

/**
 * While grouping is applied the section lists the rendered columns first, in the order the
 * grid paints them (ADR-095); ungrouped, the consumer's own order stands.
 */
export const hoistRenderedColumns = <TData>({
  columns,
  groupingKeys,
  renderedColumnKeys,
}: HoistRenderedColumnsArgs<TData>) => {
  if (groupingKeys.length === 0) return columns;

  const columnByKey = new Map(
    columns.map((column) => [String(column.key), column] as const),
  );
  const rendered = new Set(renderedColumnKeys);

  return [
    ...renderedColumnKeys
      .map((key) => columnByKey.get(key))
      .filter((column): column is TableColumn<TData> => column !== undefined),
    ...columns.filter((column) => !rendered.has(String(column.key))),
  ];
};
