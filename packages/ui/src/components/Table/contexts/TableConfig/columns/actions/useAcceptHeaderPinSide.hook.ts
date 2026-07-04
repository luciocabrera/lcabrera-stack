import type { DataKey } from '@repo/ui/components/Table/Table.types';
import type { PinConflictState, PinSide } from '@repo/ui/types/ui.types';

import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@repo/ui/components/Table/hooks';

import {
  commitResolvedPinningState,
  getPinningActionContext,
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

    const resolution = resolveAcceptedHeaderPinSideState<TData>({
      columnKey,
      columnOrder,
      columnPinning,
      columns,
      pinSide,
      staticKeys,
    });

    if (resolution.kind === 'conflict') {
      return resolution.conflict;
    }

    commitResolvedPinningState<TData>({
      columnOrder: resolution.columnOrder,
      columnPinning: resolution.columnPinning,
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
