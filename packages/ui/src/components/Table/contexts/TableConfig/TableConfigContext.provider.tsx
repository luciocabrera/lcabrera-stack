import { useEffect, useEffectEvent } from 'react';

import type {
  TableColumnsState,
  TableGroupExpansionState,
  TableGroupingState,
  TableMetaState,
} from '#ui/components/Table/Table.types';

import { useStore } from '#ui/hooks';
import { ProvideStoreContext } from '#ui/hooks/utils/provideStoreContext.util';
import { syncStoreFromProps } from '#ui/hooks/utils/syncStoreFromProps.util';

import type {
  TableConfigContextValue,
  TableConfigProviderProps,
} from './TableConfigContext.types';

import { TableConfigContext } from './TableConfigContext.context';
import {
  getInitialColumnsState,
  getInitialExpansionState,
  getInitialGroupingState,
  getInitialMetaState,
} from './utils';
import { syncColumnsStoreFromProps } from './utils/syncColumnsStoreFromProps.util';

export const TableConfigProvider = <TData extends Record<string, unknown>>({
  children,
  columnAxisEmitted,
  columnsState,
  groupingState,
  metaState,
}: TableConfigProviderProps<TData>) => {
  const normalizedMetaState = getInitialMetaState({ ...metaState });
  const normalizedGroupingState = getInitialGroupingState({
    ...groupingState,
  });
  const normalizedColumnsState = getInitialColumnsState<TData>({
    ...columnsState,
    aggregates: normalizedGroupingState.aggregates,
    crud: metaState?.crud,
    groupingKeys: normalizedGroupingState.keys,
    ...(normalizedGroupingState.columnAxis !== undefined && {
      columnAxis: normalizedGroupingState.columnAxis,
    }),
    ...(columnAxisEmitted !== undefined && { columnAxisEmitted }),
  });

  const columnsStore = useStore<TableColumnsState<TData>>(
    normalizedColumnsState,
  );
  const metaStore = useStore<TableMetaState>(normalizedMetaState);
  const groupingStore = useStore<TableGroupingState>(normalizedGroupingState);
  const expansionStore = useStore<TableGroupExpansionState>(
    getInitialExpansionState({
      ...(metaState?.defaultGroupFold !== undefined && {
        defaultFold: metaState.defaultGroupFold,
      }),
    }),
  );

  const resyncColumns = useEffectEvent(() => {
    syncColumnsStoreFromProps({
      columnAxisEmitted,
      columnsState,
      columnsStore,
      groupingStore,
      metaStore,
    });
  });

  useEffect(() => {
    syncStoreFromProps({
      next: getInitialGroupingState({ ...groupingState }),
      store: groupingStore,
    });
    resyncColumns();
  }, [groupingState, groupingStore]);

  useEffect(() => {
    syncStoreFromProps({
      next: getInitialMetaState({ ...metaStore.get(), ...metaState }),
      store: metaStore,
    });
    resyncColumns();
  }, [metaState, metaStore]);

  useEffect(() => {
    syncColumnsStoreFromProps({
      columnAxisEmitted,
      columnsState,
      columnsStore,
      groupingStore,
      metaStore,
    });
  }, [columnAxisEmitted, columnsState, columnsStore, groupingStore, metaStore]);

  useEffect(() => {
    if (metaState?.defaultGroupFold === undefined) return;
    syncStoreFromProps({
      next: { defaultFold: metaState.defaultGroupFold },
      store: expansionStore,
    });
  }, [expansionStore, metaState]);

  const value: TableConfigContextValue<TData> = {
    columnsStore,
    expansionStore,
    groupingStore,
    metaStore,
  };

  return (
    <ProvideStoreContext context={TableConfigContext} value={value}>
      {children}
    </ProvideStoreContext>
  );
};
