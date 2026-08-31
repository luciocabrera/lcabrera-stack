import type { DataKey } from '#ui/components/Table/Table.types';

import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { resolveColumnLayoutLock } from '#ui/components/Table/utils/resolveColumnLayoutLock.util';

export const useTableColumnLayoutLock = <TData>(columnKey: DataKey<TData>) => {
  const columns = useGetColumns<TData>();
  const groupingKeys = useGetTableGroupingKeys();

  return resolveColumnLayoutLock<TData>({ columnKey, columns, groupingKeys });
};
