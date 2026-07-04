import type { DataKey } from '@repo/ui/components/Table/Table.types';
import type { PinConflictResolution } from '@repo/ui/types/ui.types';

import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@repo/ui/components/Table/hooks';

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
