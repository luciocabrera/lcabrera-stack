import type {
  DataKey,
  TableColumn,
  TableColumnLayoutLock,
} from '#ui/components/Table/Table.types';

import { toDeclaredColumnKey } from '#ui/components/Table/contexts/TableConfig/columns/actions/utils/toDeclaredColumnKey.util';

type ResolveColumnLayoutLockArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly groupingKeys: readonly string[];
};

export const resolveColumnLayoutLock = <TData>({
  columnKey,
  columns,
  groupingKeys,
}: ResolveColumnLayoutLockArgs<TData>): TableColumnLayoutLock | undefined => {
  if (groupingKeys.includes(String(columnKey))) return 'group-key';

  return toDeclaredColumnKey<TData>({ columnKey, columns }) === columnKey
    ? undefined
    : 'measure';
};
