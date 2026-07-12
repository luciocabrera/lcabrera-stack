import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TablePersistenceEntry,
} from '@repo/ui/components/Table/Table.types';

import {
  serializeFiltersToURL,
  serializeSortingToURL,
} from '@repo/ui/utils/urlState';

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
}: BuildPersistencePayloadArgs<TData>) => {
  const entries: TablePersistenceEntry[] = [
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
