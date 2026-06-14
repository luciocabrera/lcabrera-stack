import type {
  ColumnFiltersState,
  DataKey,
} from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';

import { getNewColumnFiltersBasedOnColumnKey } from '@/components/Table/utils/getNewColumnFiltersBasedOnColumnKey.util';
import { serializeFiltersToURL } from '@/utils/urlState';

type ResolveColumnFilterUpdateArgs<TData> = {
  readonly columnFiltersState?: ColumnFiltersState<TData>;
  readonly columnKey: DataKey<TData>;
  readonly filter?: ColumnFilter | null;
  readonly persistenceKey: string;
};

export const resolveColumnFilterUpdate = <TData>({
  columnFiltersState,
  columnKey,
  filter,
  persistenceKey,
}: ResolveColumnFilterUpdateArgs<TData>) => {
  const columnFilters = getNewColumnFiltersBasedOnColumnKey<TData>({
    columnFiltersState,
    columnFilter: filter ?? undefined,
    columnKey,
  });

  return {
    columnFilters,
    persistenceEntry: {
      persistenceKey,
      searchParamKey: 'filters' as const,
      searchParamValue: serializeFiltersToURL(columnFilters),
      slice: 'columnFilters' as const,
      valueSlice: columnFilters,
    },
  };
};
