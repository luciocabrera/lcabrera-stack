import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
} from '@/components/Table/Table.types';
import type { PinConflictState, PinSide } from '@/types/ui.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import { getPinnedDerivedColumnsState } from '@/components/Table/utils';

import {
  commitPinningAndOrderUpdate,
  resolveAcceptedHeaderPinSideState,
} from './utils';

type AcceptHeaderPinSideArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly pinSide: PinSide;
};

export const useAcceptHeaderPinSide = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const persistTableState = usePersistTableStateAction();

  return ({
    columnKey,
    pinSide,
  }: AcceptHeaderPinSideArgs<TData>): PinConflictState | undefined => {
    const columnsState = columnsStore.get();
    const columns = columnsState?.columns ?? [];
    const columnsOrder =
      columnsState?.columnOrder ?? ([] as ColumnOrderState<TData>);
    const columnPinning =
      columnsState?.columnPinning ??
      ({ left: [], right: [] } as ColumnPinningState<TData>);
    const persistenceKey = metaStore.get()?.persistenceKey ?? '';

    const staticKeys = columnsState?.staticKeys;

    const resolution = resolveAcceptedHeaderPinSideState<TData>({
      columnKey,
      columnPinning,
      columnOrder: columnsOrder,
      columns,
      pinSide,
      staticKeys,
    });

    if (resolution.kind === 'conflict') {
      return resolution.conflict;
    }

    const { columnGroups, effectiveColumns, pinnedColumnOffsets } =
      getPinnedDerivedColumnsState<TData>({
        columnOrder: resolution.columnOrder,
        columnPinning: resolution.columnPinning,
        columnSizing: columnsState?.columnSizing,
        columns,
        columnVisibility: columnsState?.columnVisibility,
      });

    commitPinningAndOrderUpdate<TData>({
      columnGroups,
      columnsStore,
      effectiveColumns,
      newColumnOrder: resolution.columnOrder,
      newPinning: resolution.columnPinning,
      persistenceKey,
      persistTableState,
      pinnedColumnOffsets,
    });
  };
};
