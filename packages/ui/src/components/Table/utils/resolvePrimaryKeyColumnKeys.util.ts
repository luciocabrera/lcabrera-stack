import type {
  DataKey,
  TableColumn,
} from '@repo/ui/components/Table/Table.types';

type ResolvePrimaryKeyColumnKeysArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
};

/**
 * Return the keys of the primary-key columns (`isPrimaryKey === true`) in
 * declaration order, excluding the synthetic `actions` column. These keys
 * identify a row for CRUD links/actions and are appended to the query sort to
 * guarantee a stable ordering for pagination.
 */
export const resolvePrimaryKeyColumnKeys = <TData>({
  columns,
}: ResolvePrimaryKeyColumnKeysArgs<TData>): DataKey<TData>[] =>
  columns
    .filter(
      (column) => column.isPrimaryKey === true && column.key !== 'actions',
    )
    .map((column) => column.key);
