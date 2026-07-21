import type {
  DataKey,
  TableColumnsState,
} from '@lcabrera/ui/components/Table/Table.types';

import { getColumnPinSide } from '@lcabrera/ui/components/Table/utils';

type GetTableColumnDrawerStateArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnsState?: TableColumnsState<TData>;
};

/**
 * Maps a table column state snapshot into the drawer state for one column.
 */
export const getTableColumnDrawerState = <TData>({
  columnKey,
  columnsState,
}: GetTableColumnDrawerStateArgs<TData>) => {
  const allColumnFilters = columnsState?.columnFilters;
  const columnFilter =
    allColumnFilters && Object.hasOwn(allColumnFilters, columnKey)
      ? allColumnFilters[columnKey]
      : undefined;

  const allColumnSizing = columnsState?.columnSizing;
  const columnSizing =
    allColumnSizing && Object.hasOwn(allColumnSizing, columnKey)
      ? allColumnSizing[columnKey]
      : undefined;

  const sorting = columnsState?.sorting.find(
    (sort) => sort.columnKey === columnKey,
  )?.direction;

  const columnPinning = getColumnPinSide({
    columnKey,
    pinning: columnsState?.columnPinning,
  });

  return {
    columnFilter,
    columnKey,
    columnPinning,
    columnSizing,
    sorting,
  };
};
