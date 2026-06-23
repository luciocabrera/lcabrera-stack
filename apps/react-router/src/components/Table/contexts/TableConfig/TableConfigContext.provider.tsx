import type {
  TableColumnsState,
  TableMetaState,
} from '@/components/Table/Table.types';

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
  const normalizedMetaState = getInitialMetaState({
    ...metaState,
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
