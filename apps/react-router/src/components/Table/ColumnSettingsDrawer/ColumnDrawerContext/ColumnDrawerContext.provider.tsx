import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { getColumnPinSide } from '@/components/Table/utils';
import { useStore } from '@/hooks';

import type {
  ColumnDrawerProviderProps,
  ColumnDrawerState,
} from './ColumnDrawerContext.types.ts';

import { ColumnDrawerContext } from './ColumnDrawerContext.context.ts';

export const ColumnDrawerProvider = ({
  children,
  columnKey,
}: ColumnDrawerProviderProps<Record<string, unknown>>) => {
  const { columnsStore } = useTableConfigContextValue();
  const columnsState = columnsStore.get();

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

  const initialState: ColumnDrawerState<Record<string, unknown>> = {
    columnFilter,
    columnKey,
    columnPinning,
    columnSizing,
    sorting,
  };

  const columnStore =
    useStore<ColumnDrawerState<Record<string, unknown>>>(initialState);

  return (
    <ColumnDrawerContext value={{ columnStore }}>
      {children}
    </ColumnDrawerContext>
  );
};
