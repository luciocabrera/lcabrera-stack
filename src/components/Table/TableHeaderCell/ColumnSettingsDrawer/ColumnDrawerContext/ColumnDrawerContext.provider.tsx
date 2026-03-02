import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useStore } from '@/hooks';

import type {
  ColumnDrawerProviderProps,
  ColumnDrawerState,
} from './ColumnDrawerContext.types';

import { ColumnDrawerContext } from './ColumnDrawerContext.context';

export const ColumnDrawerProvider = ({
  children,
  columnKey,
}: ColumnDrawerProviderProps<unknown>) => {
  const { columnsStore } = useTableConfigContextValue();
  const columnsState = columnsStore.get();

  const allColumnFilters = columnsState?.columnFilters;
  const filterValue =
    allColumnFilters && Object.hasOwn(allColumnFilters, columnKey)
      ? allColumnFilters[columnKey]
      : undefined;

  const allColumnSizing = columnsState?.columnSizing;
  const columnWidth =
    allColumnSizing && Object.hasOwn(allColumnSizing, columnKey)
      ? allColumnSizing[columnKey]
      : undefined;

  const columnSorting = columnsState?.sorting.find(
    (sort) => sort.columnKey === columnKey,
  ) ?? { columnKey, direction: undefined };

  const initialState: ColumnDrawerState<unknown> = {
    columnFilters: filterValue ? { [columnKey]: filterValue } : {},
    columnKey,
    columnSizing: columnWidth === undefined ? {} : { [columnKey]: columnWidth },
    sorting: columnSorting,
  };

  console.log('[ColumnDrawerProvider] Initial state:', initialState);

  const columnStore = useStore<ColumnDrawerState<unknown>>(initialState);

  return (
    <ColumnDrawerContext value={{ columnStore }}>
      {children}
    </ColumnDrawerContext>
  );
};
