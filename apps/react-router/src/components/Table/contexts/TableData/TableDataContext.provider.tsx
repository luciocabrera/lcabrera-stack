import { useEffect } from 'react';

import type { TableDataState } from '@/components/Table/Table.types';
import {
  readPersistedDataStateFromSessionStorage,
  writePersistedDataStateToSessionStorage,
} from '@/components/Table/utils';

import { useStore } from '@/hooks';

import type {
  TableDataContextValue,
  TableDataProviderProps,
} from './TableDataContext.types';

import { TableDataContext } from './TableDataContext.context';
import { getInitialDataState, shouldHydratePersistedDataState } from './utils';

export const TableDataProvider = <TData extends Record<string, unknown>>({
  children,
  dataState,
  isPersistenceEnabled = true,
  persistenceKey = '',
}: TableDataProviderProps<TData>) => {
  const dataStore = useStore<TableDataState<TData>>(
    getInitialDataState<TData>(dataState ?? {}),
  );

  useEffect(() => {
    if (!isPersistenceEnabled || persistenceKey.length === 0) {
      return;
    }

    const persistedDataState = readPersistedDataStateFromSessionStorage<TData>({
      persistenceKey,
    });

    if (
      !shouldHydratePersistedDataState<TData>({
        initialDataState: dataState,
        persistedDataState,
      })
    ) {
      return;
    }

    const hydratedDataState = persistedDataState!;

    dataStore.set({
      data: hydratedDataState.data,
      hasMore: hydratedDataState.totalRows > hydratedDataState.data.length,
      totalLoadedRows: hydratedDataState.data.length,
      totalRows: hydratedDataState.totalRows,
    });
  }, [dataState, dataStore, isPersistenceEnabled, persistenceKey]);

  useEffect(() => {
    const shouldPersist = isPersistenceEnabled && persistenceKey.length > 0;

    if (shouldPersist) {
      const write = () => {
        const state = dataStore.get();

        if (state === undefined) {
          return;
        }

        writePersistedDataStateToSessionStorage({
          dataState: {
            data: state.data,
            totalRows: state.totalRows,
          },
          persistenceKey,
        });
      };

      write();

      return dataStore.subscribe(write);
    }
  }, [dataStore, isPersistenceEnabled, persistenceKey]);

  const value = {
    dataStore,
  } as TableDataContextValue;

  return <TableDataContext value={value}>{children}</TableDataContext>;
};
