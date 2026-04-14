import { getColumnPinSide } from '@/components/Table/utils';

import type {
  DataKey,
  TableColumnsState,
} from '@/components/Table/Table.types';
import type { ColumnDrawerState } from '../ColumnDrawerContext.types';

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
}: GetTableColumnDrawerStateArgs<TData>): ColumnDrawerState<TData> => {
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

  const columnPinning = getColumnPinSide(
    columnsState?.columnPinning,
    columnKey,
  );

  return {
    columnFilter,
    columnKey,
    columnPinning,
    columnSizing,
    sorting,
  };
};
