import type { DataKey } from '@/components/Table/Table.types';
import type { PinConflictResolution } from '@/types/ui.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';

import {
  commitResolvedPinningState,
  getPinningActionContext,
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
    const {
      columnOrder,
      columnPinning,
      columns,
      columnSizing,
      columnVisibility,
      drawersSyncNonce,
      persistenceKey,
      staticKeys,
    } = getPinningActionContext<TData>({ columnsStore, metaStore });

    const { columnOrder: newOrder, columnPinning: newPinning } =
      resolveAcceptedHeaderPinConflictState<TData>({
        columnKey,
        columnOrder,
        columnPinning,
        columns,
        resolution,
        side,
        staticKeys,
      });

    commitResolvedPinningState<TData>({
      columnOrder: newOrder,
      columnPinning: newPinning,
      columns,
      columnSizing,
      columnsStore,
      columnVisibility,
      drawersSyncNonce,
      metaStore,
      persistenceKey,
      persistTableState,
    });
  };
};
