import { useEffect } from 'react';

import type { TableDataState } from '@/components/Table/Table.types';

import { useStore } from '@/hooks';

import type {
  TableDataContextValue,
  TableDataProviderProps,
} from './TableDataContext.types';

import { TableDataContext } from './TableDataContext.context';
import { getInitialDataState } from './utils';

export const TableDataProvider = <TData extends Record<string, unknown>>({
  children,
  dataState,
  isPersistenceEnabled: _isPersistenceEnabled = true,
  persistenceKey: _persistenceKey = '',
}: TableDataProviderProps<TData>) => {
  const initialDataState = getInitialDataState<TData>(dataState ?? {});
  const dataStore = useStore<TableDataState<TData>>(initialDataState);

  useEffect(() => {
    dataStore.set(getInitialDataState<TData>(dataState ?? {}));
  }, [dataState, dataStore]);

  const value = {
    dataStore,
  } as TableDataContextValue;

  return <TableDataContext value={value}>{children}</TableDataContext>;
};
