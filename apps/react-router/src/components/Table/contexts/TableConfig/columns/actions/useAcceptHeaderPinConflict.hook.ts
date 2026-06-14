import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
} from '@/components/Table/Table.types';
import type { PinConflictResolution } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import { getPinnedDerivedColumnsState } from '@/components/Table/utils';

import {
  commitPinningAndOrderUpdate,
  resolveAcceptedHeaderPinConflictState,
} from './utils';

type AcceptHeaderPinConflictArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly resolution: PinConflictResolution;
  readonly side: 'left' | 'right';
};

export const useAcceptHeaderPinConflict = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const persistTableState = usePersistTableStateAction();

  return ({
    columnKey,
    resolution,
    side,
  }: AcceptHeaderPinConflictArgs<TData>) => {
    const columnsState = columnsStore.get();
    const columns = columnsState?.columns ?? [];
    const columnsOrder =
      columnsState?.columnOrder ?? ([] as ColumnOrderState<TData>);
    const currentPinning =
      columnsState?.columnPinning ??
      ({ left: [], right: [] } as ColumnPinningState<TData>);
    const persistenceKey = metaStore.get()?.persistenceKey ?? '';

    const staticKeys = columnsState?.staticKeys;

    const { columnOrder: newOrder, columnPinning: newPinning } =
      resolveAcceptedHeaderPinConflictState<TData>({
        columnKey,
        columnOrder: columnsOrder,
        columnPinning: currentPinning,
        columns,
        resolution,
        side,
        staticKeys,
      });

    const { columnGroups, effectiveColumns, pinnedColumnOffsets } =
      getPinnedDerivedColumnsState<TData>({
        columnOrder: newOrder,
        columnPinning: newPinning,
        columnSizing: columnsState?.columnSizing,
        columns,
        columnVisibility: columnsState?.columnVisibility,
      });

    commitPinningAndOrderUpdate<TData>({
      columnGroups,
      columnsStore,
      effectiveColumns,
      newColumnOrder: newOrder,
      newPinning: newPinning,
      persistenceKey,
      persistTableState,
      pinnedColumnOffsets,
    });
  };
};
