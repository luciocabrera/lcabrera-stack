import { useEffect } from 'react';

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

  useEffect(() => {
    syncStoreFromProps({
      next: getInitialGroupingState({ ...groupingState }),
      store: groupingStore,
    });
  }, [groupingState, groupingStore]);

  useEffect(() => {
    syncStoreFromProps({
      next: getInitialMetaState({ ...metaStore.get(), ...metaState }),
      store: metaStore,
    });
  }, [metaState, metaStore]);

  useEffect(() => {
    const grouping = groupingStore.get();
    const currentColumns = columnsStore.get();
    const meta = metaStore.get();
    const isLayoutTransient = meta.isColumnLayoutTransient === true;
    const isKeepPaintedAxis =
      columnAxisEmitted === undefined && grouping.columnAxis !== undefined;
    const next = getInitialColumnsState<TData>({
      ...currentColumns,
      ...columnsState,
      ...(isLayoutTransient && {
        columnOrder: currentColumns.columnOrder,
        columnPinning: currentColumns.columnPinning,
        columnSizing: currentColumns.columnSizing,
        columnVisibility: currentColumns.columnVisibility,
      }),
      aggregates: grouping.aggregates,
      crud: meta.crud,
      groupingKeys: grouping.keys,
      ...(!isKeepPaintedAxis &&
        grouping.columnAxis !== undefined && {
          columnAxis: grouping.columnAxis,
        }),
      ...(columnAxisEmitted !== undefined && { columnAxisEmitted }),
    });

    syncStoreFromProps({
      next: isKeepPaintedAxis
        ? {
            ...next,
            columnOrder: currentColumns.columnOrder,
            columnPinning: currentColumns.columnPinning,
            columns: currentColumns.columns,
            columnVisibility: currentColumns.columnVisibility,
            effectiveColumns: currentColumns.effectiveColumns,
            normalizedColumns: currentColumns.normalizedColumns,
            pinnedColumnOffsets: currentColumns.pinnedColumnOffsets,
            pinnedColumnPartition: currentColumns.pinnedColumnPartition,
            staticKeys: currentColumns.staticKeys,
          }
        : next,
      store: columnsStore,
    });
  }, [
    columnAxisEmitted,
    columnsState,
    columnsStore,
    groupingState,
    groupingStore,
    metaState,
    metaStore,
  ]);

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
