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
  const columnFilter =
    allColumnFilters && Object.hasOwn(allColumnFilters, columnKey)
      ? // eslint-disable-next-line security/detect-object-injection -- Safe: guarded by Object.hasOwn
        allColumnFilters[columnKey]
      : undefined;

  const allColumnSizing = columnsState?.columnSizing;
  const columnSizing =
    allColumnSizing && Object.hasOwn(allColumnSizing, columnKey)
      ? // eslint-disable-next-line security/detect-object-injection -- Safe: guarded by Object.hasOwn
        allColumnSizing[columnKey]
      : undefined;

  const sorting = columnsState?.sorting.find(
    (sort) => sort.columnKey === columnKey,
  )?.direction;

  const currentPinning = columnsState?.columnPinning;
  const columnPinning = currentPinning?.left.includes(columnKey)
    ? 'left'
    : currentPinning?.right.includes(columnKey)
      ? 'right'
      : undefined;

  const initialState: ColumnDrawerState<unknown> = {
    columnFilter,
    columnKey,
    columnPinning,
    columnSizing,
    sorting,
  };

  console.log('Initializing ColumnDrawerProvider with state:', initialState);

  const columnStore = useStore<ColumnDrawerState<unknown>>(initialState);

  return (
    <ColumnDrawerContext value={{ columnStore }}>
      {children}
    </ColumnDrawerContext>
  );
};
