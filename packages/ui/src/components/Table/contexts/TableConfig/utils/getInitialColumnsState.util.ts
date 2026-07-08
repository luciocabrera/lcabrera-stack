import type {
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  DataKey,
  TableColumnsState,
  TableMetaState,
} from '@repo/ui/components/Table/Table.types';

import { ACTIONS_COLUMN_KEY } from '@repo/ui/components/Table/Table.constants';
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

  const rawColumnPinning = sessionState.columnPinning ?? columnPinning;
  const pinnedLeft = rawColumnPinning.left.filter(
    (columnKey) => columnKey !== ACTIONS_COLUMN_KEY,
  );
  const pinnedRight = rawColumnPinning.right.filter(
    (columnKey) => columnKey !== ACTIONS_COLUMN_KEY,
  );

  const nextColumnPinning = {
    left: pinnedLeft,
    right: [...pinnedRight, ACTIONS_COLUMN_KEY],
  } as ColumnPinningState<TData>;
  const nextColumnOrder = sessionState.columnOrder ?? columnOrder;
  const nextColumnSizing = sessionState.columnSizing ?? columnSizing;
  const nextColumnVisibility =
    sessionState.columnVisibility ?? columnVisibility;

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
