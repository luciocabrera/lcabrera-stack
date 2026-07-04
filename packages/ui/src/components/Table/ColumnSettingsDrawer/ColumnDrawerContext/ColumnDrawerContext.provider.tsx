import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useStore } from '@repo/ui/hooks';

import type {
  ColumnDrawerProviderProps,
  ColumnDrawerState,
} from './ColumnDrawerContext.types';

import { ColumnDrawerContext } from './ColumnDrawerContext.context';
import { getTableColumnDrawerState } from './utils';

export const ColumnDrawerProvider = ({
  children,
  columnKey,
}: ColumnDrawerProviderProps<Record<string, unknown>>) => {
  const { columnsStore } = useTableConfigContextValue();
  const columnsState = columnsStore.get();
  const initialState: ColumnDrawerState<Record<string, unknown>> =
    getTableColumnDrawerState({
      columnKey,
      columnsState,
    });

  const columnStore =
    useStore<ColumnDrawerState<Record<string, unknown>>>(initialState);

  return (
    <ColumnDrawerContext value={{ columnStore }}>
      {children}
    </ColumnDrawerContext>
  );
};
