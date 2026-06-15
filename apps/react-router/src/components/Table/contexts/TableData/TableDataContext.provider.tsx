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
import { getInitialDataState } from './utils';

export const TableDataProvider = <TData extends Record<string, unknown>>({
  children,
  dataState,
  isPersistenceEnabled = true,
  persistenceKey = '',
}: TableDataProviderProps<TData>) => {
  const persistedDataState = isPersistenceEnabled
    ? readPersistedDataStateFromSessionStorage<TData>({ persistenceKey })
    : undefined;

  const dataStore = useStore<TableDataState<TData>>(
    getInitialDataState<TData>({
      ...dataState,
      ...(persistedDataState === undefined ? {} : persistedDataState),
    }),
  );

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

    return;
  }, [dataStore, isPersistenceEnabled, persistenceKey]);

  const value = {
    dataStore,
  } as TableDataContextValue;

  return <TableDataContext value={value}>{children}</TableDataContext>;
};
