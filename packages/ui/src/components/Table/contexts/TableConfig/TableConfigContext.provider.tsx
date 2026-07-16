import type {
  TableColumnsState,
  TableMetaState,
} from '@repo/ui/components/Table/Table.types';

import { readPersistedUiStateFromSessionStorage } from '@repo/ui/components/Table/utils';
import { useStore } from '@repo/ui/hooks';

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
    appId: metaState?.appId,
    crud: metaState?.crud,
    persistenceKey: metaState?.persistenceKey ?? '',
  });
  const persistedUiState = readPersistedUiStateFromSessionStorage({
    appId: metaState?.appId,
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

  const value: TableConfigContextValue<TData> = {
    columnsStore,
    metaStore,
  };

  // The context is declared non-generic; useTableConfigContextValue<TData>()
  // restores the generic on read. Erase the type parameter only here.
  return (
    <TableConfigContext value={value as TableConfigContextValue}>
      {children}
    </TableConfigContext>
  );
};
