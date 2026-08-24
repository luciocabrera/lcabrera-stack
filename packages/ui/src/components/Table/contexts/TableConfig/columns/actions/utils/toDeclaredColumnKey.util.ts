import type { DataKey, TableColumn } from '#ui/components/Table/Table.types';

import { parseTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

type ToDeclaredColumnKeyArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columns: readonly TableColumn<TData>[];
};

/**
 * Guard on the result, never the argument: permissions are keyed by declared column and a
 * pre-map check tests a key no lock contains.
 */
export const toDeclaredColumnKey = <TData>({
  columnKey,
  columns,
}: ToDeclaredColumnKeyArgs<TData>): DataKey<TData> => {
  if (columns.some((column) => column.key === columnKey)) {
    return columnKey;
  }

  const aggregate = parseTableAggregateToken(String(columnKey));

  if (aggregate === undefined) {
    return columnKey;
  }

  const source = columns.find(
    (column) => String(column.key) === aggregate.columnKey,
  );

  return source?.key ?? columnKey;
};
