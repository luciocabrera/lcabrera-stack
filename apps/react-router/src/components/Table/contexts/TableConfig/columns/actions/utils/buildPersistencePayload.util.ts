import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TablePersistenceConfig,
} from '@/components/Table/Table.types';

import { serializeFiltersToURL, serializeSortingToURL } from '@/utils/urlState';

type PersistenceEntry<TSlice = unknown> = {
  readonly persistenceKey: string;
  readonly searchParamKey?: string;
  readonly searchParamValue?: string;
  readonly slice: keyof TablePersistenceConfig;
  readonly valueSlice: TSlice;
};

type BuildPersistencePayloadArgs<TData> = {
  readonly columnFilters: ColumnFiltersState<TData>;
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columnSizing: ColumnSizingState<TData>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  readonly persistenceKey: string;
  readonly sorting: SortingState<TData>;
};

export const buildPersistencePayload = <TData>({
  columnFilters,
  columnOrder,
  columnPinning,
  columnSizing,
  columnVisibility,
  persistenceKey,
  sorting,
}: BuildPersistencePayloadArgs<TData>): PersistenceEntry[] => {
  const entries: PersistenceEntry[] = [
    {
      persistenceKey,
      searchParamKey: 'filters',
      searchParamValue: serializeFiltersToURL(columnFilters),
      slice: 'columnFilters',
      valueSlice: columnFilters,
    },
    {
      persistenceKey,
      searchParamKey: 'sort',
      searchParamValue: serializeSortingToURL<TData>(sorting),
      slice: 'sorting',
      valueSlice: sorting,
    },
    {
      persistenceKey,
      slice: 'columnSizing',
      valueSlice: columnSizing,
    },
    {
      persistenceKey,
      slice: 'columnPinning',
      valueSlice: columnPinning,
    },
    {
      persistenceKey,
      slice: 'columnOrder',
      valueSlice: columnOrder,
    },
  ];

  if (columnVisibility) {
    entries.push({
      persistenceKey,
      slice: 'columnVisibility',
      valueSlice: columnVisibility,
    });
  }

  return entries;
};
