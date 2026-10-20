import type {
  TableColumnsState,
  TableGroupingState,
  TableMetaState,
} from '#ui/components/Table/Table.types';
import type { ColumnAxisEmittedAggregate } from '#ui/components/Table/utils/columnAxisEmitted.types';
import type { TStore } from '#ui/hooks/useStore.hook';

import { syncStoreFromProps } from '#ui/hooks/utils/syncStoreFromProps.util';

import { getInitialColumnsState } from './getInitialColumnsState.util';

type SyncColumnsStoreFromPropsArgs<TData extends Record<string, unknown>> = {
  readonly columnAxisEmitted?: readonly ColumnAxisEmittedAggregate[];
  readonly columnsState?: Partial<TableColumnsState<TData>>;
  readonly columnsStore: TStore<TableColumnsState<TData>>;
  readonly groupingStore: Pick<TStore<TableGroupingState>, 'get'>;
  readonly metaStore: Pick<TStore<TableMetaState>, 'get'>;
};

export const syncColumnsStoreFromProps = <
  TData extends Record<string, unknown>,
>({
  columnAxisEmitted,
  columnsState,
  columnsStore,
  groupingStore,
  metaStore,
}: SyncColumnsStoreFromPropsArgs<TData>) => {
  const grouping = groupingStore.get();
  const currentColumns = columnsStore.get();
  const meta = metaStore.get();
  const isLayoutTransient = meta.isColumnLayoutTransient === true;
  const { columnAxisEmitted: storedEmitted, ...currentColumnsRest } =
    currentColumns;
  const nextEmitted =
    grouping.columnAxis === undefined
      ? columnAxisEmitted
      : (columnAxisEmitted ?? storedEmitted);
  const next = getInitialColumnsState<TData>({
    ...currentColumnsRest,
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
    ...(grouping.columnAxis !== undefined && {
      columnAxis: grouping.columnAxis,
    }),
    ...(nextEmitted !== undefined && { columnAxisEmitted: nextEmitted }),
  });

  syncStoreFromProps({ next, store: columnsStore });
};
