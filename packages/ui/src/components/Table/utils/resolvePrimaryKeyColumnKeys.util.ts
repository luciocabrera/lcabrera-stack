import type { TableColumn } from '#ui/components/Table/Table.types';

type ResolvePrimaryKeyColumnKeysArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
};

export const resolvePrimaryKeyColumnKeys = <TData>({
  columns,
}: ResolvePrimaryKeyColumnKeysArgs<TData>) =>
  columns
    .filter(
      (column) => column.isPrimaryKey === true && column.key !== 'actions',
    )
    .map((column) => column.key);
