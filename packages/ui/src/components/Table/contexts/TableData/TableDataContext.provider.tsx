import { useEffect } from 'react';

import type { TableDataState } from '#ui/components/Table/Table.types';

import { useStore } from '#ui/hooks';

import type {
  TableDataContextValue,
  TableDataProviderProps,
} from './TableDataContext.types';

import { TableDataContext } from './TableDataContext.context';
import { getInitialDataState } from './utils';

export const TableDataProvider = <TData extends Record<string, unknown>>({
  children,
  dataState,
}: TableDataProviderProps<TData>) => {
  const initialDataState = getInitialDataState<TData>(dataState ?? {});
  const dataStore = useStore<TableDataState<TData>>(initialDataState);

  useEffect(() => {
    dataStore.set(getInitialDataState<TData>(dataState ?? {}));
  }, [dataState, dataStore]);

  const value: TableDataContextValue<TData> = { dataStore };

  // The context is declared non-generic; useTableDataContextValue<TData>()
  // restores the generic on read. Erase the type parameter only here.
  return (
    <TableDataContext value={value as TableDataContextValue}>
      {children}
    </TableDataContext>
  );
};
