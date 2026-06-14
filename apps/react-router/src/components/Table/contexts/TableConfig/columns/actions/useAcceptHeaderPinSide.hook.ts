import type { DataKey } from '@/components/Table/Table.types';
import type { PinConflictState, PinSide } from '@/types/ui.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';

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
      columnSizing,
      columnVisibility,
      columns,
      persistenceKey,
      staticKeys,
    } = getPinningActionContext<TData>({ columnsStore, metaStore });

    const resolution = resolveAcceptedHeaderPinSideState<TData>({
      columnKey,
      columnPinning,
      columnOrder,
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
      columnSizing,
      columnVisibility,
      columns,
      columnsStore,
      persistenceKey,
      persistTableState,
    });
  };
};
