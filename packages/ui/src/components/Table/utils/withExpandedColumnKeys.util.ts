import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnVisibilityState,
  DataKey,
  TableColumn,
} from '../Table.types';

type WithExpandedColumnKeysArgs<TData> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly expandColumn: (
    column: TableColumn<TData>,
  ) => readonly TableColumn<TData>[];
  readonly expandKey: (key: DataKey<TData>) => readonly DataKey<TData>[];
};

export const withExpandedColumnKeys = <TData>({
  columnOrder,
  columnPinning,
  columns,
  columnVisibility,
  expandColumn,
  expandKey,
}: WithExpandedColumnKeysArgs<TData>) => {
  const expandKeys = (
    keys: readonly DataKey<TData>[],
  ): readonly DataKey<TData>[] => [
    ...new Set(keys.flatMap((key) => expandKey(key))),
  ];

  return {
    columnOrder: expandKeys(columnOrder),
    columnPinning: {
      left: expandKeys(columnPinning.left),
      right: expandKeys(columnPinning.right),
    },
    columns: columns.flatMap((column) => [...expandColumn(column)]),
    columnVisibility: new Set(expandKeys([...columnVisibility])),
  };
};
