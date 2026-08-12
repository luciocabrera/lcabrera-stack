import type {
  ColumnOrderState,
  TableColumn,
} from '#ui/components/Table/Table.types';

type OrderColumnsByKeysArgs<TData> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columns: readonly TableColumn<TData>[];
};

/**
 * Orders `columns` to follow `columnOrder`, appending any column the order
 * does not mention in its existing relative position. An order entry with no
 * matching column is dropped — the order is a preference, not a source of
 * columns.
 *
 * Keyed by string rather than `DataKey<TData>` for the reason
 * `splitColumnsByPinning` documents: `DataKey<unknown>` narrows to the literal
 * `'actions'` and stops accepting the broader keys the columns carry.
 */
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
