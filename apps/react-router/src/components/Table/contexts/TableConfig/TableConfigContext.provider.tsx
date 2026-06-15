import type {
  TableColumnsState,
  TableMetaState,
} from '@/components/Table/Table.types';
import {
  useHydrateTableSessionState,
  useMetaStatePersistEffect,
} from '@/components/Table/hooks';
import { useStore } from '@/hooks';

import type {
  TableConfigContextValue,
  TableConfigProviderProps,
} from './TableConfigContext.types';

import { TableConfigContext } from './TableConfigContext.context';
import { getInitialColumnsState, getInitialMetaState } from './utils';

export const TableConfigProvider = <TData extends Record<string, unknown>>({
  children,
  columnsState,
  metaState,
}: TableConfigProviderProps<TData>) => {
  const persistenceKey = metaState?.persistenceKey ?? '';

  const columnsStore = useStore<TableColumnsState<TData>>(
    getInitialColumnsState<TData>({ ...columnsState }),
  );
  const metaStore = useStore<TableMetaState>(
    getInitialMetaState({ ...metaState }),
  );

  // On client mount: restore per-tab sessionStorage state into both stores.
  useHydrateTableSessionState({
    columnsStore: columnsStore as never,
    metaStore,
    persistenceKey,
  });

  // Subscribe to metaStore and keep sessionStorage in sync on every change.
  useMetaStatePersistEffect({ metaStore, persistenceKey });

  const value = {
    columnsStore,
    metaStore,
  } as TableConfigContextValue;

  return <TableConfigContext value={value}>{children}</TableConfigContext>;
};
