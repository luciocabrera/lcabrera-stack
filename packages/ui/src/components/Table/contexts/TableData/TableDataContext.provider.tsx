import { useEffect } from 'react';

import type { TableDataState } from '#ui/components/Table/Table.types';

import { useStore } from '#ui/hooks';
import { ProvideStoreContext } from '#ui/hooks/utils/provideStoreContext.util';
import { syncStoreFromProps } from '#ui/hooks/utils/syncStoreFromProps.util';

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
  const { data, error, isLoading, isLoadingMore, totalRows } = dataState ?? {};

  useEffect(() => {
    syncStoreFromProps({
      next: getInitialDataState<TData>({
        ...(data !== undefined && { data }),
        error,
        ...(isLoading !== undefined && { isLoading }),
        ...(isLoadingMore !== undefined && { isLoadingMore }),
        ...(totalRows !== undefined && { totalRows }),
      }),
      store: dataStore,
    });
  }, [data, dataStore, error, isLoading, isLoadingMore, totalRows]);

  const value: TableDataContextValue<TData> = { dataStore };

  return (
    <ProvideStoreContext context={TableDataContext} value={value}>
      {children}
    </ProvideStoreContext>
  );
};
