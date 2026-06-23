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
};

export const resolveColumnFilterUpdate = <TData>({
  columnFiltersState,
  columnKey,
  filter,
}: ResolveColumnFilterUpdateArgs<TData>) => {
  const columnFilters = getNewColumnFiltersBasedOnColumnKey<TData>({
    columnFilter: filter ?? undefined,
    columnFiltersState,
    columnKey,
  });

  return {
    columnFilters,
    persistenceEntry: {
      searchParamKey: 'filters' as const,
      searchParamValue: serializeFiltersToURL(columnFilters),
    },
  };
};
