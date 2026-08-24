import type {
  ColumnOrderState,
  TableColumn,
} from '#ui/components/Table/Table.types';

type OrderColumnsByKeysArgs<TData> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columns: readonly TableColumn<TData>[];
};

export const orderColumnsByKeys = <TData>({
  columnOrder,
  columns,
}: OrderColumnsByKeysArgs<TData>) => {
  const columnByKey = new Map<string, TableColumn<TData>>(
    columns.map((col) => [col.key, col]),
  );
  const orderedKeys = new Set<string>(columnOrder);

  return [
    ...columnOrder
      .map((key) => columnByKey.get(key))
      .filter((col): col is TableColumn<TData> => col !== undefined),
    ...columns.filter((col) => !orderedKeys.has(col.key)),
  ];
};
