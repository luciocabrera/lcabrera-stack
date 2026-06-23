import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  DataKey,
  TableColumnsState,
  TableMetaState,
} from '@/components/Table/Table.types';

import {
  deriveColumnViewState,
  // getEffectiveColumns,
  // getNormalizedColumns,
  // getPinnedColumnOffsets,
  // getStaticColumnKeys,
  readPersistedStateFromSessionStorage,
  // splitColumnsByPinning,
} from '@/components/Table/utils';

type GetInitialTableStateArgs<TData> = Partial<TableColumnsState<TData>> &
  Pick<TableMetaState, 'persistenceKey'>;

export const getInitialColumnsState = <TData>({
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
    persistenceKey,
  });

  const nextColumnOrder =
    sessionState.columnOrder ?? columnOrder ?? ([] as ColumnOrderState<TData>);
  const nextColumnPinning =
    sessionState.columnPinning ??
    columnPinning ??
    ({
      left: [],
      right: [],
    } as ColumnPinningState<TData>);
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
  // const effectiveColumns = getEffectiveColumns<TData>({
  //   columnOrder,
  //   columnPinning,
  //   columns,
  //   columnVisibility,
  // });

  // const normalizedColumns = getNormalizedColumns<TData>({
  //   columns,
  //   sorting,
  // });

  // const staticKeys = getStaticColumnKeys<TData>(columns);

  // const columnGroups = splitColumnsByPinning<TData>({
  //   columnPinning,
  //   effectiveColumns,
  // });

  // const pinnedColumnOffsets = getPinnedColumnOffsets<TData>({
  //   columnPinning,
  //   columnSizing,
  //   effectiveColumns,
  // });

  // console.log('getInitialColumnsState', {
  //   columnFilters,
  //   columnGroups,
  //   columnOrder,
  //   columnPinning,
  //   columns,
  //   columnSizing,
  //   columnVisibility,
  //   effectiveColumns,
  //   normalizedColumns,
  //   pinnedColumnOffsets,
  //   sessionState,
  //   sorting,
  // });

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
