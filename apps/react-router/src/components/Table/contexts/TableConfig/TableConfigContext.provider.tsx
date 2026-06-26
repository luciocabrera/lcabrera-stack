import type {
  TableColumnsState,
  TableMetaState,
} from '@/components/Table/Table.types';

import { readPersistedUiStateFromSessionStorage } from '@/components/Table/utils';
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
  const normalizedColumnsState = getInitialColumnsState<TData>({
    ...columnsState,
    persistenceKey: metaState?.persistenceKey ?? '',
  });
  const persistedUiState = readPersistedUiStateFromSessionStorage({
    persistenceKey: metaState?.persistenceKey ?? '',
  });
  const normalizedMetaState = getInitialMetaState({
    ...metaState,
    persistedUiState,
  });

  const columnsStore = useStore<TableColumnsState<TData>>(
    normalizedColumnsState,
  );
  const metaStore = useStore<TableMetaState>(normalizedMetaState);

  const value = {
    columnsStore,
    metaStore,
  } as TableConfigContextValue;

  return <TableConfigContext value={value}>{children}</TableConfigContext>;
};
