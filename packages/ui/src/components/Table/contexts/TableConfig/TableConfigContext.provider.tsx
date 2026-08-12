import type {
  TableColumnsState,
  TableGroupingState,
  TableMetaState,
} from '#ui/components/Table/Table.types';

import { useStore } from '#ui/hooks';

import type {
  TableConfigContextValue,
  TableConfigProviderProps,
} from './TableConfigContext.types';

import { TableConfigContext } from './TableConfigContext.context';
import {
  getInitialColumnsState,
  getInitialGroupingState,
  getInitialMetaState,
} from './utils';

export const TableConfigProvider = <TData extends Record<string, unknown>>({
  children,
  columnsState,
  metaState,
}: TableConfigProviderProps<TData>) => {
  const normalizedColumnsState = getInitialColumnsState<TData>({
    ...columnsState,
    crud: metaState?.crud,
  });
  // All three stores seed purely from the loader's URL- and cookie-derived
  // state, so the client renders exactly what the server did — see
  // getInitialColumnsState.
  const normalizedMetaState = getInitialMetaState({ ...metaState });
  const normalizedGroupingState = getInitialGroupingState({
    groupingKeys: metaState?.groupingKeys,
  });

  const columnsStore = useStore<TableColumnsState<TData>>(
    normalizedColumnsState,
  );
  const metaStore = useStore<TableMetaState>(normalizedMetaState);
  const groupingStore = useStore<TableGroupingState>(normalizedGroupingState);

  const value: TableConfigContextValue<TData> = {
    columnsStore,
    groupingStore,
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
