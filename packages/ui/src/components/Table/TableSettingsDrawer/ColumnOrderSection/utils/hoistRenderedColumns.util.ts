import type { TableColumn } from '#ui/components/Table/Table.types';

type HoistRenderedColumnsArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly declaredGroupingKeys: readonly string[];
  readonly renderedColumnKeys: readonly string[];
};

export const hoistRenderedColumns = <TData>({
  columns,
  declaredGroupingKeys,
  renderedColumnKeys,
}: HoistRenderedColumnsArgs<TData>) => {
  if (declaredGroupingKeys.length === 0) return columns;

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
