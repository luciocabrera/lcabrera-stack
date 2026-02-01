import type {
  TableColumnsState,
  TableMetaState,
} from '@/components/Table/Table.types';

import { useStore } from '@/hooks';

import type { TableConfigProviderProps } from './TableConfigContext.types';

import { TableConfigContext, type TableConfigContextValue } from './TableConfigContext.context';
import { getInitialColumnsState, getInitialMetaState } from './utils';

export const TableConfigProvider = <TData extends Record<string, unknown>>({
  children,
  columnsState,

  metaState,
}: TableConfigProviderProps<TData>) => {
  // Read persisted state from cookies (SSR-safe)
  // Cookies are available during SSR, avoiding hydration mismatches
  // const persistedState = persistenceKey
  //   ? readPersistedStateFromCookie({ persistenceKey })
  //   : {};

  const columnsStore = useStore<TableColumnsState<TData>>(
    getInitialColumnsState<TData>({ ...columnsState }),
  );

  const metaStore = useStore<TableMetaState>(
    getInitialMetaState({ ...metaState }),
  );

  const value = {
    columnsStore,
    metaStore,
  } as TableConfigContextValue;

  return <TableConfigContext value={value}>{children}</TableConfigContext>;
};
