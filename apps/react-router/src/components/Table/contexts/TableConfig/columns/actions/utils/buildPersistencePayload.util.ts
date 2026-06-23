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

type BuildPersistencePayloadArgs<TData> = {
  readonly columnFilters: ColumnFiltersState<TData>;
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columnSizing: ColumnSizingState<TData>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  readonly persistenceKey: string;
  readonly sorting: SortingState<TData>;
};

type PersistenceEntry<TSlice = unknown> = {
  readonly persistenceKey?: string;
  readonly searchParamKey?: string;
  readonly searchParamValue?: string;
  readonly slice?: keyof TablePersistenceConfig;
  readonly valueSlice?: TSlice;
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
      searchParamKey: 'filters',
      searchParamValue: serializeFiltersToURL(columnFilters),
    },
    {
      searchParamKey: 'sorting',
      searchParamValue: serializeSortingToURL<TData>(sorting),
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
