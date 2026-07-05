import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  DataKey,
  TableColumnsState,
  TableMetaState,
} from '@repo/ui/components/Table/Table.types';

import {
  deriveColumnViewState,
  readPersistedStateFromSessionStorage,
} from '@repo/ui/components/Table/utils';

type GetInitialTableStateArgs<TData> = Partial<TableColumnsState<TData>> &
  Pick<TableMetaState, 'appId' | 'persistenceKey'>;

export const getInitialColumnsState = <TData>({
  appId,
  columnFilters = {} as ColumnFiltersState<TData>,
  columnOrder = [],
  columnPinning = { left: [], right: [] },
  columns = [],
  columnSizing = {} as ColumnSizingState<TData>,
  columnVisibility = new Set<DataKey<TData>>(),
  persistenceKey,
  sorting = [],
}: GetInitialTableStateArgs<TData>) => {
  const sessionState = readPersistedStateFromSessionStorage<TData>({
    appId,
    persistenceKey,
  });

  const nextColumnOrder =
    sessionState.columnOrder ?? columnOrder ?? ([] as ColumnOrderState<TData>);
  const rawColumnPinning =
    sessionState.columnPinning ??
    columnPinning ??
    ({ left: [], right: [] } as ColumnPinningState<TData>);
  // Normalize partial pinning objects (e.g. `{}` from a cookie miss) so the
  // derived-columns pipeline always has left/right arrays to read.
  const nextColumnPinning = {
    left: rawColumnPinning.left ?? [],
    right: rawColumnPinning.right ?? [],
  } as ColumnPinningState<TData>;
  const nextColumnSizing =
    sessionState.columnSizing ??
    columnSizing ??
    ({} as ColumnSizingState<TData>);
  const nextColumnVisibility =
    sessionState.columnVisibility ??
    columnVisibility ??
    (new Set() as ColumnVisibilityState<TData>);

  const {
    columnGroups,
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
    staticKeys,
  } = deriveColumnViewState<TData>({
    columnOrder: nextColumnOrder,
    columnPinning: nextColumnPinning,
    columns,
    columnSizing: nextColumnSizing,
    columnVisibility: nextColumnVisibility,
    sorting,
  });

  return {
    columnFilters,
    columnGroups,
    columnOrder: nextColumnOrder,
    columnPinning: nextColumnPinning,
    columns,
    columnSizing: nextColumnSizing,
    columnVisibility: nextColumnVisibility,
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
    sorting,
    staticKeys,
  };
};
