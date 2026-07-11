import type {
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  DataKey,
  TableColumnsState,
  TableCrudConfig,
  TableMetaState,
} from '@repo/ui/components/Table/Table.types';

import { ACTIONS_COLUMN_KEY } from '@repo/ui/components/Table/Table.constants';
import {
  deriveColumnViewState,
  readPersistedStateFromSessionStorage,
  resolveTableActionsColumn,
} from '@repo/ui/components/Table/utils';

type GetInitialTableStateArgs<TData extends Record<string, unknown>> = Partial<
  TableColumnsState<TData>
> &
  Pick<TableMetaState, 'appId' | 'persistenceKey'> & {
    readonly crud?: TableCrudConfig;
  };

export const getInitialColumnsState = <TData extends Record<string, unknown>>({
  appId,
  columnFilters = {} as ColumnFiltersState<TData>,
  columnOrder = [],
  columnPinning = { left: [], right: [] },
  columns = [],
  columnSizing = {} as ColumnSizingState<TData>,
  columnVisibility = new Set<DataKey<TData>>(),
  crud,
  persistenceKey,
  sorting = [],
}: GetInitialTableStateArgs<TData>) => {
  const sessionState = readPersistedStateFromSessionStorage<TData>({
    appId,
    persistenceKey,
  });

  const { columns: resolvedColumns, hasActionsColumn } =
    resolveTableActionsColumn<TData>({ columns, crud });

  // Persisted pinning state can arrive partial (e.g. `{}` on a cookie miss),
  // so treat both sides as optional and normalize to empty arrays.
  const rawColumnPinning: Partial<ColumnPinningState<TData>> =
    sessionState.columnPinning ?? columnPinning;
  const pinnedLeft = (rawColumnPinning.left ?? []).filter(
    (columnKey) => columnKey !== ACTIONS_COLUMN_KEY,
  );
  const pinnedRight = (rawColumnPinning.right ?? []).filter(
    (columnKey) => columnKey !== ACTIONS_COLUMN_KEY,
  );

  const nextColumnPinning = {
    left: pinnedLeft,
    right: hasActionsColumn
      ? [...pinnedRight, ACTIONS_COLUMN_KEY]
      : pinnedRight,
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
    columns: resolvedColumns,
    columnSizing: nextColumnSizing,
    columnVisibility: nextColumnVisibility,
    sorting,
  });

  return {
    columnFilters,
    columnGroups,
    columnOrder: nextColumnOrder,
    columnPinning: nextColumnPinning,
    columns: resolvedColumns,
    columnSizing: nextColumnSizing,
    columnVisibility: nextColumnVisibility,
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
    sorting,
    staticKeys,
  };
};
